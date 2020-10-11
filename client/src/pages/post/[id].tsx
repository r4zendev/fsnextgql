import React from 'react';
import { withUrqlClient } from 'next-urql';

import { createUrqlClient } from '../../utils/createUrqlClient';
import { EditDeletePostButtons, Layout } from '../../components';
import { Box, Flex, Heading } from '@chakra-ui/core';
import { useGetPostFromUrl } from '../../utils/useGetPostFromUrl';

const Post: React.FC<{}> = ({}) => {
  const [{ data, error, fetching }] = useGetPostFromUrl();

  if (fetching) {
    return (
      <Layout>
        <Box>Loading...</Box>
      </Layout>
    );
  }

  if (error) {
    return <Box>{error.message}</Box>;
  }

  if (!data?.post) {
    return <Layout>Could not find a post :(</Layout>;
  }

  return (
    <Layout>
      <Flex alignItems="center">
        <Heading mb={4}>{data.post.title}</Heading>
        <EditDeletePostButtons
          id={data.post.id}
          creatorId={data.post.creator.id}
        />
      </Flex>
      {data.post.text}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
