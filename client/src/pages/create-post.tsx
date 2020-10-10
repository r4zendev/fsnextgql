import React, { useEffect, useState } from 'react';
import { Box, Button } from '@chakra-ui/core';
import { Formik, Form } from 'formik';
import { useRouter } from 'next/router';

import { InputField, Layout } from '../components';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { useCreatePostMutation } from '../generated/graphql';
import { useIsAuth } from '../utils/useIsAuth';

const CreatePost: React.FC<{}> = () => {
  const router = useRouter();
  const { fetching, data } = useIsAuth({ requestPolicy: 'network-only' });
  const [content, setContent] = useState<JSX.Element>(<></>);
  const [, createPost] = useCreatePostMutation();

  useEffect(() => {
    if (!fetching && data?.me)
      setContent(
        <Layout variant="small">
          <Formik
            initialValues={{ title: '', text: '' }}
            onSubmit={async (values) => {
              const { error } = await createPost({ input: values });
              if (!error) {
                router.push('/');
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form>
                <Box mt={4}>
                  <InputField name="title" />
                </Box>
                <Box mt={4}>
                  <InputField
                    textarea
                    name="text"
                    placeholder="Post body..."
                    label="Body"
                  />
                </Box>
                <Button
                  mt={2}
                  isLoading={isSubmitting}
                  type="submit"
                  variantColor="teal"
                >
                  Create post
                </Button>
              </Form>
            )}
          </Formik>
        </Layout>,
      );
  }, [fetching]);

  return content;
};

export default withUrqlClient(createUrqlClient)(CreatePost);
