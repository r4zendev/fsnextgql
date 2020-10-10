import { Field, ObjectType } from 'type-graphql';
import { Entity, Column, PrimaryColumn, BaseEntity, ManyToMany } from 'typeorm';
import { Post, User } from '.';

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {
  @Field()
  @Column({ type: 'int' })
  value: number;

  @Field()
  @PrimaryColumn()
  userId: number;

  @Field(() => User)
  @ManyToMany(() => User, (user) => user.posts)
  user: User;

  @Field()
  @PrimaryColumn()
  postId: number;

  @Field(() => Post)
  @ManyToMany(() => Post, (post) => post.updoots)
  post: Post;
}
