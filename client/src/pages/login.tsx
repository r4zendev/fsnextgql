import React from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, Flex, Link } from '@chakra-ui/core';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';

import { Wrapper, InputField } from '../components';
import { useLoginMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { createUrqlClient } from '../utils/createUrqlClient';

interface Props {}

const login = (props: Props) => {
  const router = useRouter();
  const [, loginMutation] = useLoginMutation();

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameOrEmail: '', password: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await loginMutation(values);
          const { data } = response;
          if (data?.login.errors) {
            setErrors(toErrorMap(data.login.errors));
          } else if (response.data?.login.user) {
            console.log('router.query.next => ', router.query.next);
            if (typeof router.query.next === 'string') {
              console.log('redirecting...');
              router.replace(router.query.next);
            } else {
              router.push('/');
            }
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Box mt={4}>
              <InputField
                name="usernameOrEmail"
                placeholder="Username or email"
                label="Username or email"
              />
            </Box>
            <Box mt={4}>
              <InputField name="password" type="password" />
            </Box>
            <Flex alignItems="center" mt={4}>
              <Button
                mr={2}
                isLoading={isSubmitting}
                type="submit"
                variantColor="teal"
              >
                Login
              </Button>
              <NextLink href="forgot-password">
                <Link>Forgot password?</Link>
              </NextLink>
            </Flex>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(login);
