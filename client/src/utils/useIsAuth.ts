import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { Exact, useMeQuery } from '../generated/graphql';
import { UseQueryArgs } from 'urql';

type MeQueryOpts = Pick<
  UseQueryArgs<
    Exact<{
      [key: string]: never;
    }>
  >,
  'variables' | 'requestPolicy' | 'pollInterval' | 'context' | 'pause'
>;

export const useIsAuth = (queryOpts?: MeQueryOpts) => {
  const router = useRouter();
  const [{ data, fetching }] = useMeQuery(queryOpts);

  useEffect(() => {
    if (!fetching && !data?.me) {
      router.replace('/login?next=' + router.pathname);
    }
  }, [fetching, data, router]);
  return { data, fetching };
};
