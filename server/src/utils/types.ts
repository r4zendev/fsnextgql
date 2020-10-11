import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { createUpdootLoader } from './createUpdootLoader';
import { createUserLoader } from './createUserLoader';

export type MyContext = {
  req: Request & { session: Express.Session };
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
  updootLoader: ReturnType<typeof createUpdootLoader>;
};
