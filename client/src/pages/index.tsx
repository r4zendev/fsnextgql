import React, { useState } from 'react';
import { Box, Heading, Text, Link, Stack, Flex, Button } from '@chakra-ui/core';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { Layout, UpdootSection, EditDeletePostButtons } from '../components';
import {
  PostsQueryVariables,
  useDeletePostMutation,
  useMeQuery,
  usePostsQuery,
} from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const Index = () => {
  const router = useRouter();

  const [variables, setVariables] = useState<PostsQueryVariables>({
    limit: 15,
    cursor: null,
  });

  const [{ data: meData }] = useMeQuery();

  const [{ data, fetching }, refetch] = usePostsQuery({
    variables,
    requestPolicy: 'cache-and-network', // Invalidating the cache would be cheaper here. (See createUrqlClient.ts)
  });

  if (!fetching && !data) {
    return <Text>Your query failed for some reason</Text>;
  }

  return (
    <Layout>
      {!data && fetching ? null : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) => (
            <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
              <UpdootSection post={p} />
              <Box flex={1}>
                <Flex alignItems="center">
                  <NextLink href="post/[id]" as={`/post/${p.id}`}>
                    <Link>
                      <Heading fontSize="xl">{p.title}</Heading>
                    </Link>
                  </NextLink>
                  <EditDeletePostButtons
                    id={p.id}
                    creatorId={p.creator.id}
                    refetch
                    refetchData={refetch}
                  />
                </Flex>
                <Text>Posted by {p.creator.username}</Text>
                <Text mt={4}>{p.textSnippet}</Text>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}
      {data && data.posts.moreAvailable ? (
        <Flex>
          <Button
            m="auto"
            my={8}
            isLoading={fetching}
            onClick={() => {
              setVariables((prev) => ({
                limit: prev.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              }));
            }}
          >
            Load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
