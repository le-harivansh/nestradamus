export const testUser: Readonly<User> = {
  email: 'user@email.dev',
  password: 'password',
};

export interface User {
  email: string;
  password: string;
}
