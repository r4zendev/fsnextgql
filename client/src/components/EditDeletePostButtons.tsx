import React from 'react';
import { Flex, IconButton, Link } from '@chakra-ui/core';
import NextLink from 'next/link';
import { useDeletePostMutation, useMeQuery } from '../generated/graphql';

interface Props {
  id: number;
  creatorId: number;
  refetch?: boolean;
  refetchData?: () => void;
}

export const EditDeletePostButtons: React.FC<Props> = ({
  id,
  creatorId,
  refetch,
  refetchData,
}) => {
  const [{ data }] = useMeQuery();
  const [, deletePost] = useDeletePostMutation();

  if (data?.me?.id !== creatorId) {
    return null;
  }

  if (refetch && !refetchData) {
    throw new Error(
      'Refetch option set to true but no refetchData function supplied.',
    );
  }

  return (
    <Flex ml="auto">
      <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton as={Link} mr={2} icon="edit" aria-label="Edit post" />
      </NextLink>

      <IconButton
        variantColor="red"
        icon="delete"
        aria-label="Delete post"
        onClick={async () => {
          await deletePost({ id });
          if (refetch) refetchData!(); // updates in createUrqlClient is cheaper.
        }}
      />
    </Flex>
  );
};
