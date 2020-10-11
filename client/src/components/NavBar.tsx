import { Box, Button, Flex, Heading, Link } from '@chakra-ui/core';
import NextLink from 'next/link';
import React from 'react';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

export const NavBar: React.FC<{}> = ({}) => {
  const [{ data, fetching }, refetch] = useMeQuery({
    requestPolicy: 'cache-and-network',
    pause: isServer(),
  });

  const [{ fetching: logoutFetching }, logoutMutation] = useLogoutMutation();
  let body: JSX.Element | null = null;
  if (fetching) {
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={2}>Login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>Register</Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Flex alignItems="center">
        <NextLink href="/create-post">
          <Button as={Link} ml="auto" mr={4}>
            Create Post
          </Button>
        </NextLink>
        <Box mr={4}>{data.me.username}</Box>
        <Button
          variant="link"
          onClick={async () => {
            await logoutMutation();
            refetch();
          }}
          isLoading={logoutFetching}
        >
          Logout
        </Button>
      </Flex>
    );
  }
  return (
    <Flex zIndex={100} position="sticky" bg="tomato" p={4} alignItems="center">
      <Flex maxW={800} flex={1} alignItems="center" margin="auto">
        <NextLink href="/">
          <Link>
            <Heading>LiReddit</Heading>
          </Link>
        </NextLink>
        <Box ml="auto">{body}</Box>
      </Flex>
    </Flex>
  );
};
