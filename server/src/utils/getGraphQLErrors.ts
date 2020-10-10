export const getGraphQLErrors = (field: string, message: string) => {
  return {
    errors: [
      {
        field,
        message,
      },
    ],
  };
};
