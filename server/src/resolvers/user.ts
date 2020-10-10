import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import argon2 from 'argon2';
import { v4 } from 'uuid';
import { getConnection } from 'typeorm';

import { User } from '../entities';
import { MyContext } from '../utils/types';
import {
  FieldError,
  sendEmail,
  validateRegister,
  getGraphQLErrors,
} from '../utils';
import { UserInput } from '../utils/inputs';
import { FORGET_PASSWORD_PREFIX } from '../constants';

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.email;
    }
    return '';
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<User | null> {
    const user = await User.findOne(req.session.userId);
    if (!req.session.userId || !user) {
      return null;
    }
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('input') input: UserInput,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    const { username, password, email } = input;

    const errors = validateRegister(input);
    if (errors) return { errors };

    const hashedPw = await argon2.hash(password);
    let user: User | undefined;
    try {
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username,
          password: hashedPw,
          email,
        })
        .returning('*')
        .execute();
      user = result.raw[0];
    } catch (err) {
      console.log('err => ', err);
      if (err.detail.includes('already exists')) {
        return getGraphQLErrors('username', 'User already exists');
      }
    }

    if (!user) {
      return getGraphQLErrors('username', 'No user has been found');
    }

    // Auto login
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    const query = usernameOrEmail.includes('@')
      ? { email: usernameOrEmail }
      : { username: usernameOrEmail };
    const user = await User.findOne({ where: query });
    if (!user) {
      return getGraphQLErrors(
        'usernameOrEmail',
        'That username does not exist',
      );
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return getGraphQLErrors('password', 'The password is incorrect');
    }

    req.session.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext,
  ): Promise<Boolean> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return true;
    }
    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24 * 3,
    );

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">Reset password</a>`,
    );
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis }: MyContext,
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return getGraphQLErrors('newPassword', 'Length has to be greater than 2');
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return getGraphQLErrors('token', 'The token is invalid or expired');
    }

    const numId = +userId;
    const user = await User.findOne(numId);
    if (!user) {
      return getGraphQLErrors('token', 'User no longer exists');
    }

    const password = await argon2.hash(newPassword);
    await User.update({ id: numId }, { password });

    await redis.del(key);

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie('qid');
        if (err) {
          console.log('err => ', err);
          resolve(false);
          return;
        }
        resolve(true);
      }),
    );
  }
}
