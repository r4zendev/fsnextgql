import React from 'react';
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql';
import { Flex, Icon, Text } from '@chakra-ui/core';

interface Props {
  post: PostSnippetFragment;
}

export const UpdootSection: React.FC<Props> = ({ post }) => {
  const [, updoot] = useVoteMutation();
  console.log('post.voteStatus => ', post.voteStatus);

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      mr={4}
    >
      <Icon
        cursor="pointer"
        name="chevron-up"
        size="24px"
        color={post.voteStatus === 1 ? 'green.300' : undefined}
        onClick={() => {
          updoot({ postId: post.id, value: 1 });
        }}
      />
      <Text cursor="default">{post.points}</Text>
      <Icon
        cursor="pointer"
        name="chevron-down"
        size="24px"
        color={post.voteStatus === -1 ? 'red.300' : undefined}
        onClick={() => {
          updoot({ postId: post.id, value: -1 });
        }}
      />
    </Flex>
  );
};
