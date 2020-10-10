import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import { Alert, Box, Button } from '@chakra-ui/core';
import { withUrqlClient } from 'next-urql';

import { Wrapper, InputField } from '../components';
import { useForgotPasswordMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const ForgotPassword: React.FC<{}> = () => {
  const [complete, setComplete] = useState(false);
  const [, forgotPassword] = useForgotPasswordMutation();

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: '' }}
        onSubmit={async (values) => {
          const response = await forgotPassword(values);
          setComplete(true);
          console.log('response.data => ', response.data);
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Box mt={4}>
              <InputField name="email" placeholder="E-mail" label="E-mail" />
            </Box>
            <Button
              mt={2}
              isLoading={isSubmitting}
              type="submit"
              variantColor="teal"
            >
              {complete && (
                <Alert>
                  The link to change your password has been sent to your e-mail.
                </Alert>
              )}
              Change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
