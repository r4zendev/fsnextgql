import { MyContext } from '../utils/types';
import { MiddlewareFn } from 'type-graphql';

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error('Not authenticated');
  }

  return next();
};
