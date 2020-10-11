import {
  dedupExchange,
  fetchExchange,
  ClientOptions,
  Exchange,
  stringifyVariables,
} from 'urql';
import { pipe, tap } from 'wonka';
import Router from 'next/router';
import { Cache, cacheExchange, Resolver } from '@urql/exchange-graphcache';
import gql from 'graphql-tag';

import { VoteMutationVariables } from '../generated/graphql';
import { isServer } from './isServer';
import { NextPageContext } from 'next';

const errorExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error) {
        if (error?.message.includes('Not authenticated')) {
          Router.replace('/login');
        }
      }
    }),
  );
};

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const isInTheCache = cache.resolve(
      cache.resolveFieldByKey(
        entityKey,
        `${fieldName}(${stringifyVariables(fieldArgs)})`,
      ) as string,
      'posts',
    );

    info.partial = !isInTheCache;

    let results: string[] = [];
    let moreAvailable = true;

    fieldInfos.forEach((fi) => {
      const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, 'posts') as string[];
      const _moreAvailable = cache.resolve(key, 'moreAvailable');
      if (!_moreAvailable) {
        moreAvailable = !!_moreAvailable;
      }
      results.push(...data);
    });

    return { __typename: 'PaginatedPosts', moreAvailable, posts: results };
  };
};

const invalidateAllPosts = (cache: Cache) => {
  const allFields = cache.inspectFields('Query');
  const fieldInfos = allFields.filter((info) => info.fieldName === 'posts');
  fieldInfos.forEach((fi) => {
    cache.invalidate('Query', 'posts', fi.arguments || {});
  });
};

export const createUrqlClient = (
  ssrExchange: Exchange,
  ctx: NextPageContext | undefined,
): ClientOptions => {
  let cookie = '';
  if (isServer()) {
    if (ctx?.req?.headers?.cookie) cookie = ctx.req.headers.cookie;
  }

  return {
    url: 'http://localhost:4000/graphql/',
    fetchOptions: {
      credentials: 'include' as const,
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
    exchanges: [
      errorExchange,
      dedupExchange,
      cacheExchange({
        keys: { PaginatedPosts: () => null },
        resolvers: { Query: { posts: cursorPagination() } },
        updates: {
          Mutation: {
            // createPost: (_result, args, cache, info) => {
            //   const allFields = cache.inspectFields('Query');
            //   const fieldInfos = allFields.filter(
            //     (info) => info.fieldName === 'posts',
            //   );
            //   fieldInfos.forEach((fi) => {
            //     cache.invalidate('Query', 'posts', fi.arguments || {});
            //   });
            // },
            // deletePost: (_result, args, cache, info) => {
            //   cache.invalidate({
            //     __typename: 'Post',
            //     id: (args as DeletePostMutationVariables).id,
            //   });
            // },
            logout: (_result, _args, cache, _info) => {
              invalidateAllPosts(cache);
            },
            login: (_result, _args, cache, _info) => {
              invalidateAllPosts(cache);
            },
            vote: (_result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;
              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    points
                    voteStatus
                  }
                `,
                { __typename: 'Post', id: postId },
              );
              console.log('data => ', data);
              if (data) {
                if (data.voteStatus === value) {
                  cache.writeFragment(
                    gql`
                      fragment __ on Post {
                        points
                        voteStatus
                      }
                    `,
                    {
                      __typename: 'Post',
                      id: postId,
                      points: (data.points as number) - value,
                      voteStatus: null,
                    },
                  );
                  return;
                }
                const newPoints =
                  (data.points as number) + (data.voteStatus ? 2 : 1) * value;
                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      points
                      voteStatus
                    }
                  `,
                  {
                    __typename: 'Post',
                    id: postId,
                    points: newPoints,
                    voteStatus: value,
                  },
                );
              }
            },
          },
        },
      }),
      ssrExchange,
      fetchExchange,
    ],
  };
};
