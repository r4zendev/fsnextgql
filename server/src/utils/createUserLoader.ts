import DataLoader from 'dataloader';
import { User } from '../entities';

export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);
    // const userIdToUser: Record<number, User> = {};
    // users.forEach((u) => {
    //   userIdToUser[u.id] = u;
    // });
    // return userIds.map((userId) => userIdToUser[userId]);
    return userIds.map(
      (userId) =>
        users.find((u) => u.id === userId) ||
        new Error(`No user found for id ${userId}`),
    );
  });
