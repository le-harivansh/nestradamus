import { Request } from 'express';

export type AuthenticationJwtPayload = { id: string };

export type JwtType = 'access-token' | 'refresh-token';

export type RequestPropertyStoringAuthenticatedEntity =
  | Extract<keyof Request, 'user'>
  | Extract<keyof Request, 'administrator'>;
