import type { Role } from '../../../generated/prisma/enums';

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  role?: Role;
  phone?: string;
}
