export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export interface RegisterUserOutput {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

