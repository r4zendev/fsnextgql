import React from 'react';
import { Box, Button, Text } from '@chakra-ui/core';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';

import { Layout, InputField } from '../../../components';
import { useUpdatePostMutation } from '../../../generated/graphql';
import { createUrqlClient } from '../../../utils/createUrqlClient';
import { useGetPostFromUrl } from '../../../utils/useGetPostFromUrl';

const EditPost: React.FC<{}> = () => {
  const [{ data, fetching }] = useGetPostFromUrl();
  const [, updatePost] = useUpdatePostMutation();
  const router = useRouter();

  if (fetching) {
    return (
      <Layout>
        <Text>Loading...</Text>
      </Layout>
    );
  }

  if (!data?.post) {
    return (
      <Layout>
        <Text>Could not find the post...</Text>
      </Layout>
    );
  }

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async (values) => {
          const { error } = await updatePost({
            id: data.post!.id,
            ...values,
          });
          console.log('error => ', error);
          if (!error) {
            router.back();
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
              Update post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(EditPost);
