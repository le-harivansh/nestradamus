import { NextFunction, Request, Response } from 'express';

export function authenticateUser(user: unknown, requestKey: string) {
  return function (request: Request, _response: Response, next: NextFunction) {
    (request as unknown as Record<string, unknown>)[requestKey] = user;

    next();
  };
}
