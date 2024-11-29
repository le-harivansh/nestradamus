import { DynamicModule, Inject, Module } from '@nestjs/common';

import {
  AUTHORIZATION_MODULE_ASYNC_OPTIONS_TYPE,
  AUTHORIZATION_MODULE_OPTIONS_TOKEN,
  AuthorizationConfigurableModuleClass,
} from './authorization.module-definition';
import {
  AuthorizationModuleOptions,
  authorizationModuleOptionsValidationSchema,
} from './authorization.module-options';
import { AUTHORIZATION_PERMISSIONS_CONTAINER } from './constant';
import { PermissionContainer } from './container/permission.container';
import { UserService } from './service/user.service';

@Module({})
export class AuthorizationModule extends AuthorizationConfigurableModuleClass {
  constructor(
    @Inject(AUTHORIZATION_MODULE_OPTIONS_TOKEN)
    authorizationModuleOptions: AuthorizationModuleOptions,
  ) {
    super();

    // Validate the authorization options passed to the module.
    authorizationModuleOptionsValidationSchema.parse(
      authorizationModuleOptions,
    );
  }

  static forRootAsync(
    options: typeof AUTHORIZATION_MODULE_ASYNC_OPTIONS_TYPE,
  ): DynamicModule {
    const {
      providers = [],
      exports = [],
      ...dynamicModuleOptions
    } = super.forRootAsync(options);

    return {
      ...dynamicModuleOptions,

      providers: [
        ...providers,

        UserService,

        {
          provide: AUTHORIZATION_PERMISSIONS_CONTAINER,
          inject: [AUTHORIZATION_MODULE_OPTIONS_TOKEN],
          useFactory: ({
            permissionsMap,
            permissionStringSeparator,
          }: AuthorizationModuleOptions) =>
            new PermissionContainer(permissionsMap, permissionStringSeparator),
        },
      ],

      exports: [...exports, AUTHORIZATION_PERMISSIONS_CONTAINER, UserService],
    };
  }
}
