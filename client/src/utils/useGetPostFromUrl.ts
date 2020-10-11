import { useRouter } from 'next/router';

import { usePostQuery } from '../generated/graphql';

export const useGetPostFromUrl = () => {
  const router = useRouter();
  const { id } = router.query;
  let finalId = typeof id === 'string' ? +id : -1;

  return usePostQuery({
    pause: finalId === -1,
    variables: {
      id: finalId,
    },
  });
};
