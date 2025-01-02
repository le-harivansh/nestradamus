export { AuthorizationModule } from './authorization.module';
export { AuthorizationGuard } from './guard/authorization.guard';
export { setPermissions } from './decorator/authorization.decorator';
export { IsPermission } from './validator/permission.validator';
export type {
  RecursiveConditionalObject,
  KeyValueTupleOf,
  ObjectWithOnlyValuesOfType,
  ObjectWithoutValuesOfType,
  PermissionAndRequestParameterObjectFrom,
} from './type';
