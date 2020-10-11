import { MyContext } from '../utils/types';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';

import { Post, Updoot, User } from '../entities';
import { PostInput } from '../utils/inputs';
import { isAuth } from '../middleware';
import { getConnection } from 'typeorm';

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  moreAvailable: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { updootLoader, req }: MyContext,
  ) {
    if (!req.session.userId) {
      return null;
    }

    const updoot = await updootLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });

    return updoot ? updoot.value : null;
    // return updootLoader.load({ postId, userId: req.session.userId });
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext,
  ) {
    const isUpdoot = value !== -1;
    const finalValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    if (updoot && updoot.value !== finalValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `

          update updoot
          set value = $1
          where "postId" = $2 and "userId" = $3

        `,
          [finalValue, postId, userId],
        );

        await tm.query(
          `

          update post
          set points = points + $1
          where id = $2

        `,
          [finalValue * 2, postId],
        );
      });
    } else if (!updoot) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `

          insert into updoot ("userId", "postId", value)
          values ($1, $2, $3)

        `,
          [userId, postId, finalValue],
        );

        await tm.query(
          `

          update post
          set points = points + $1
          where id = $2
          
        `,
          [finalValue, postId],
        );
      });
    } else {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `

          delete from updoot
          where "postId" = $1 and "userId" = $2

        `,
          [postId, userId],
        );

        await tm.query(
          `

          update post
          set points = points - $1
          where id = $2

        `,
          [finalValue, postId],
        );
      });
    }

    // await Updoot.insert({
    //   userId,
    //   postId,
    //   value: finalValue,
    // });

    // await Post.update({id: postId}, {})

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const rlPlusOne = realLimit + 1;

    const replacements: any[] = [rlPlusOne];

    if (cursor) {
      replacements.push(new Date(+cursor));
    }

    // json_build_object(
    //   'id', u.id,
    //   'username', u.username,
    //   'email', u.email,
    //   'createdAt', u."createdAt",
    //   'updatedAt', u."updatedAt"
    // ) creator,

    // inner join public.user u on u.id = p."creatorId"
    // ^ This is replaced by field resolver.

    const posts = (await getConnection().query(
      `
        select p.*
        from post p
        ${cursor ? `where p."createdAt" < $2` : ''}
        order by p."createdAt" DESC
        limit $1
      `,
      replacements,
    )) as Post[];

    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder('p')
    //   .innerJoinAndSelect('p.creator', 'u', 'u.id = p."creatorId"')
    //   .orderBy('"createdAt"', 'DESC')
    //   .take(rlPlusOne);

    // if (cursor) {
    //   qb.where('"createdAt" < :cursor', { cursor: new Date(+cursor) });
    // }

    // const posts = await qb.getMany();

    return {
      posts: posts.slice(0, posts.length - 1),
      moreAvailable: posts.length === rlPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id, { relations: ['creator'] });
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext,
  ): Promise<Post | null> {
    return Post.create({ ...input, creatorId: req.session.userId }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title') title: string,
    @Arg('text') text: string,
    @Ctx() { req }: MyContext,
  ): Promise<Post | null> {
    const { raw } = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning('*')
      .execute();
    return raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    // non-cascade
    // const post = await Post.findOne(id);
    // if (!post) {
    //   return false;
    // }
    // if (post.creatorId !== req.session.userId) {
    //   throw new Error('Not authorized');
    // }
    // await Updoot.delete({ postId: id });
    // await post.remove();

    await Post.delete({ id, creatorId: req.session.userId });
    return true;
  }
}
