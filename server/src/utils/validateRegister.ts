import { FieldError } from '.';
import { UserInput } from './inputs';

export const validateRegister = (
  input: UserInput,
): FieldError[] | undefined => {
  if (!input.email.includes('@')) {
    return [
      {
        field: 'email',
        message: 'Invalid email',
      },
    ];
  }
  if (input.username.length <= 2) {
    return [
      {
        field: 'username',
        message: 'Length has to be greater than 2',
      },
    ];
  }
  if (input.password.length <= 2) {
    return [
      {
        field: 'password',
        message: 'Password length has to be greater than 2',
      },
    ];
  }
  return;
};
