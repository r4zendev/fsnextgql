import { Field, ObjectType } from 'type-graphql';
import {
  Entity,
  Column,
  PrimaryColumn,
  BaseEntity,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
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
  @ManyToOne(() => Post, (post) => post.updoots, { onDelete: 'CASCADE' })
  post: Post;
}
