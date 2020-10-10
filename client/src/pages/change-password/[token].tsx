import React, { useState } from 'react';
import { Alert, Box, Button, Link } from '@chakra-ui/core';
import { Formik, Form } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import NextLink from 'next/link';

import { Wrapper, InputField } from '../../components';
import { useChangePasswordMutation } from '../../generated/graphql';
import { toErrorMap } from '../../utils/toErrorMap';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../../utils/createUrqlClient';

const ChangePassword: NextPage<{}> = () => {
  const router = useRouter();
  const [, changePasswordMutation] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState('');

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: '', repeatPassword: '' }}
        onSubmit={async (values, { setErrors }) => {
          console.log('values => ', values);
          const { newPassword, repeatPassword } = values;
          if (!(newPassword === repeatPassword)) {
            return setErrors({ newPassword: 'Passwords do not match!' });
          } else {
            const response = await changePasswordMutation({
              token:
                typeof router.query.token === 'string'
                  ? router.query.token
                  : '',
              newPassword,
            });
            const { data } = response;
            if (data?.changePassword.errors) {
              const errorMap = toErrorMap(data.changePassword.errors);
              if ('token' in errorMap) {
                setTokenError(errorMap.token);
              } else {
                setErrors(errorMap);
              }
            } else if (response.data?.changePassword.user) {
              router.push('/');
            }
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Box mt={4}>
              <InputField
                name="newPassword"
                placeholder="New password"
                label="New password"
                type="password"
              />
            </Box>
            <Box mt={4}>
              <InputField
                name="repeatPassword"
                placeholder="Repeat password"
                label="Repeat password"
                type="password"
              />
            </Box>
            {tokenError && (
              <Box>
                <Alert color="red.600">{tokenError}</Alert>
                <NextLink href="forgot-password">
                  <Link>Forget again</Link>
                </NextLink>
              </Box>
            )}
            <Button
              mt={4}
              isLoading={isSubmitting}
              type="submit"
              variantColor="teal"
            >
              Change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(ChangePassword);
