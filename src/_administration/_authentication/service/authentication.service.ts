import { Injectable } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';

import { Administrator } from '@/_administration/_administrator/schema/administrator.schema';
import { AdministratorService } from '@/_administration/_administrator/service/administrator.service';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { AuthenticationService as AbstractAuthenticationService } from '@/_library/authentication/service/authentication.service';

@Injectable()
export class AuthenticationService extends AbstractAuthenticationService<Administrator> {
  constructor(
    loggerService: WinstonLoggerService,
    private readonly administratorService: AdministratorService,
  ) {
    loggerService.setContext(
      `${AuthenticationService.name}[${Administrator.name}]`,
    );

    super(loggerService);
  }

  override async retrieveAuthenticatableEntity(
    username: string,
  ): Promise<HydratedDocument<Administrator>> {
    return this.administratorService.findOne({ username });
  }
}
