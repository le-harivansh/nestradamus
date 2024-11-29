export { AuthorizationModule } from './authorization.module';
export { AuthorizationGuard } from './guard/authorization.guard';
export { setPermissions } from './decorator/authorization.decorator';
export type {
  KeyValueTupleOf,
  ObjectWithOnlyValuesOfType,
  ObjectWithoutValuesOfType,
  PermissionAndRequestParameterObjectFrom,
} from './type';
