import { Box, Button, Flex, Link } from '@chakra-ui/core';
import NextLink from 'next/link';
import React from 'react';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
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
      <Flex>
        <Box mr={4}>{data.me.username}</Box>
        <Button
          variant="link"
          onClick={() => {
            logoutMutation();
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
    <Flex zIndex={100} position="sticky" bg="tomato" p={4}>
      <Box ml="auto">{body}</Box>
    </Flex>
  );
};
