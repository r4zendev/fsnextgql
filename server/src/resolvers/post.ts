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

import { Post, Updoot } from '../entities';
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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext,
  ) {
    console.log('vote req.session.userId => ', req.session.userId);
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
    @Ctx() { req }: MyContext,
  ): Promise<PaginatedPosts> {
    console.log('get req.session.userId => ', req.session.userId);
    const realLimit = Math.min(50, limit);
    const rlPlusOne = realLimit + 1;

    const replacements: any[] = [rlPlusOne];

    if (req.session.userId) {
      replacements.push(req.session.userId);
    }

    if (cursor) {
      if (!req.session.userId) {
        replacements.push(null);
      }
      replacements.push(new Date(+cursor));
    }

    const posts = (await getConnection().query(
      `
      select p.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email,
        'createdAt', u."createdAt",
        'updatedAt', u."updatedAt"
      ) creator,
      ${
        req.session.userId
          ? '(select value from updoot where "userId" = $2 and "postId" = p.id) as "voteStatus"'
          : 'null as "voteStatus"'
      }
      from post p
      inner join public.user u on u.id = p."creatorId"
      ${cursor ? `where p."createdAt" < $3` : ''}
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
  post(@Arg('id') id: number): Promise<Post | undefined> {
    return Post.findOne(id);
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
  async updatePost(
    @Arg('id') id: number,
    @Arg('title', () => String, { nullable: true }) title: string,
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      return null;
    }
    if (typeof title !== 'undefined') {
      Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg('id') id: number): Promise<boolean> {
    await Post.delete(id);
    return true;
  }
}
