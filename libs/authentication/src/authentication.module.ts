import {
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import {
  AUTHENTICATION_MODULE_OPTIONS_TOKEN,
  AuthenticationConfigurableModuleClass,
} from './authentication.module-definition';
import {
  AuthenticationModuleOptions,
  authenticationModuleOptionsValidationSchema,
} from './authentication.module-options';
import { LoginController } from './controller/login.controller';
import { TokenRefreshController } from './controller/token-refresh.controller';
import { RequiresAccessTokenMiddleware } from './middleware/requires-access-token.middleware';
import { RequiresRefreshTokenMiddleware } from './middleware/requires-refresh-token.middleware';
import { CredentialValidationService } from './service/credential-validation.service';
import { TokenService } from './service/token.service';
import { UserIdExtractorService } from './service/user-id-extractor.service';
import { UserResolverService } from './service/user-resolver.service';
import { ResponseService } from './service/response.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [LoginController, TokenRefreshController],
  providers: [
    TokenService,
    CredentialValidationService,
    UserResolverService,
    UserIdExtractorService,
    ResponseService,
  ],
})
export class AuthenticationModule
  extends AuthenticationConfigurableModuleClass
  implements NestModule
{
  constructor(
    @Inject(AUTHENTICATION_MODULE_OPTIONS_TOKEN)
    private readonly authenticationModuleOptions: AuthenticationModuleOptions,
  ) {
    super();

    // Validate the authentication options passed to the module.
    authenticationModuleOptionsValidationSchema.parse(
      this.authenticationModuleOptions,
    );
  }

  configure(consumer: MiddlewareConsumer) {
    /****************
     * Access-Token *
     ****************/
    consumer
      .apply(RequiresAccessTokenMiddleware)
      .exclude(
        /**
         * We do not need an access-token on the login route, since we are
         * using the user credentials to generate an access-token for the user.
         */
        {
          path: this.authenticationModuleOptions.routes.login,
          method: RequestMethod.POST,
        },

        /**
         * We do not need an access-token on the access-token refresh route,
         * since the access-token is already expired at this point, and we use
         * a refresh-token to create a new access-token for the user.
         */
        {
          path: this.authenticationModuleOptions.routes.refresh.accessToken,
          method: RequestMethod.POST,
        },

        /**
         * Routes where an access-token is not required.
         */
        ...this.authenticationModuleOptions.authenticateUser.except,
      )
      .forRoutes(
        /**
         * We require an access-token to refresh a refresh-token.
         */
        {
          path: this.authenticationModuleOptions.routes.refresh.refreshToken,
          method: RequestMethod.POST,
        },

        /**
         * Routes where a valid access-token is required.
         */
        ...this.authenticationModuleOptions.authenticateUser.forRoutes,
      );

    /*****************
     * Refresh-Token *
     *****************/
    consumer.apply(RequiresRefreshTokenMiddleware).forRoutes(
      /**
       * We need a refresh-token to refresh an access-token.
       */
      {
        path: this.authenticationModuleOptions.routes.refresh.accessToken,
        method: RequestMethod.POST,
      },
    );
  }
}
