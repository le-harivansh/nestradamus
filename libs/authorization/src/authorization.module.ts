import { Inject, Module } from '@nestjs/common';

import {
  AUTHORIZATION_MODULE_OPTIONS_TOKEN,
  AuthorizationConfigurableModuleClass,
} from './authorization.module-definition';
import {
  AuthorizationModuleOptions,
  authorizationModuleOptionsValidationSchema,
} from './authorization.module-options';
import { AUTHORIZATION_PERMISSIONS_CONTAINER } from './constant';
import { PermissionContainer } from './helper/permission-container';
import { UserCallbackService } from './service/user-callback.service';
import { PermissionValidatorConstraint } from './validator/constraint/permission.validator-constraint';

@Module({
  providers: [
    {
      provide: AUTHORIZATION_PERMISSIONS_CONTAINER,
      inject: [AUTHORIZATION_MODULE_OPTIONS_TOKEN],
      useFactory: ({
        permissionsMap,
        permissionStringSeparator,
      }: AuthorizationModuleOptions) =>
        new PermissionContainer(permissionsMap, permissionStringSeparator),
    },

    UserCallbackService,

    PermissionValidatorConstraint,
  ],
  exports: [
    AUTHORIZATION_PERMISSIONS_CONTAINER,
    UserCallbackService,
    PermissionValidatorConstraint,
  ],
})
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
}
