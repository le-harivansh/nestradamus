import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { verify } from 'argon2';
import { HydratedDocument } from 'mongoose';

import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';

import { Authenticatable } from '../schema/authenticatable.interface';

export abstract class AuthenticationService<T extends Authenticatable> {
  constructor(private readonly loggerService: WinstonLoggerService) {}

  /**
   * This method should retrieve the authenticatable entity
   * (`user`, `administrator` et al.) through the provided `username`
   * parameter.
   *
   * If no authenticatable entity was found, a `NotFoundException` should be
   * thrown.
   */
  abstract retrieveAuthenticatableEntity(
    username: string,
  ): Promise<HydratedDocument<T>>;

  private async verifyPassword(
    authenticatableEntity: HydratedDocument<T>,
    clearTextPassword: string,
  ): Promise<boolean> {
    /**
     * Because `T` implements the `Authenticatable` interface, it **SHOULD**
     * have a `password` field.
     */
    return verify(authenticatableEntity.get('password'), clearTextPassword);
  }

  async authenticateUsingCredentials(
    username: string,
    password: string,
  ): Promise<HydratedDocument<T>> {
    let retrievedAuthenticatableEntity: HydratedDocument<T> | null = null;

    try {
      retrievedAuthenticatableEntity =
        await this.retrieveAuthenticatableEntity(username);
    } catch (error) {
      /**
       * We want to re-throw any exception that is **NOT** a `NotFoundException`,
       * since `findOne` only throws `NotFoundException`s. Any other exception
       * caught here would most likely have been thrown by the framework; and
       * we **DO NOT** want to catch those.
       */
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    if (
      retrievedAuthenticatableEntity &&
      (await this.verifyPassword(retrievedAuthenticatableEntity, password))
    ) {
      this.loggerService.log(
        'Valid credentials provided',
        retrievedAuthenticatableEntity,
      );

      return retrievedAuthenticatableEntity;
    }

    throw new UnauthorizedException('Invalid credentials.');
  }
}
