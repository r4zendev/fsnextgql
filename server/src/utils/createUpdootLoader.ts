// import DataLoader from 'dataloader';
// import { Updoot } from '../entities';

// export const createUpdootLoader = () =>
//   new DataLoader<{ postId: number; userId: number }, number | null>(
//     async (ids) => {
//       return Promise.all(
//         ids.map(async (pair) => {
//           const { postId, userId } = pair;
//           const updoot = await Updoot.findOne({
//             where: {
//               postId,
//               userId,
//             },
//           });
//           return updoot?.value || null;
//         }),
//       );
//     },
//   );

import { Updoot } from '../entities/Updoot';
import DataLoader from 'dataloader';

// [{postId: 5, userId: 10}]
// [{postId: 5, userId: 10, value: 1}]
export const createUpdootLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findByIds(keys as any);
      const updootIdsToUpdoot: Record<string, Updoot> = {};
      updoots.forEach((updoot) => {
        updootIdsToUpdoot[`${updoot.userId}|${updoot.postId}`] = updoot;
      });

      console.log('updootIdsToUpdoot => ', updootIdsToUpdoot);

      return keys.map(
        (key) => updootIdsToUpdoot[`${key.userId}|${key.postId}`],
      );
    },
  );
