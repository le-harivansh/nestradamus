# Authorization

This library is used to authorize users to do certain actions. It exposes the following classes:

- `AuthorizationModule`: which is used to import and configure the library within an application;
- `AuthorizationGuard`: which is used to enforce the authorization feature within the application;
- `setPermissions`: which is used to create authorization decorators - ultimately used on controllers to set required permissions;
- Several types & generics which can be used to create type-safe authorization decorators.

## Configuration

Assuming the following permission-map:

```ts
export const permissionsMap = {
  test: {
    read: {
      own: () => true,
      others: () => false,
    },
    create: () => true,
    update: (
      authenticatedUser: TestUser,
      { taskCreatorId }: { taskCreatorId: string },
    ) => authenticatedUser.id === taskCreatorId,
  },
};
```

An example configuration when registering the module (globally) would be as follows:

```ts
AuthorizationLibraryModule.forRootAsync({
  useFactory: () => ({
    permissionsMap,
    permissionStringSeparator: ':',
    user: {
      retrieveFromRequest: ({ user }: Request) => user,
      getPermissions: ({ permissions }: WithId<User>) => permissions,
    },
  }),
  isGlobal: true,
});
```

## Setup

Some additional setup is required to be able to use the module more comfortably; mainly the setup of a typed decorator for use in controllers & route handlers.

### Typed Decorator

The following is an example of a typed decorator using the provided `setPermission` function, and helper types:

```ts
export function RequiresPermission(
  ...permissions: (
    | keyof ObjectWithOnlyValuesOfType<
        never,
        PermissionAndRequestParameterObject
      >
    | KeyValueTupleOf<
        ObjectWithoutValuesOfType<never, PermissionAndRequestParameterObject>
      >
  )[]
): ReturnType<typeof setPermissions> {
  return setPermissions(permissions);
}

type PermissionAndRequestParameterObject =
  PermissionAndRequestParameterObjectFrom<
    ReturnType<typeof createPermissionsMap>
  >;
```

#### Usage

The permission decorator (`RequiresPermission`) can then be used as follows:

```ts
@Controller('hello-world-route')
export class TestController {
  @Get()
  @RequiresPermission('test:read:own')
  show() {
    // implementation details...
  }

  @Get('others')
  @RequiresPermission({ and: ['test:read:own', 'test:read:others'] })
  list() {
    // implementation details...
  }

  @Post()
  @RequiresPermission('test:create')
  create() {
    // implementation details...
  }

  @Patch('/creator/:creatorId')
  @RequiresPermission(['test:update', { taskCreatorId: 'creatorId' }])
  update() {
    // implementation details...
  }
}
```

##### Conditional authorization

The `RequiresPermission` decorator accepts any of the following:

1. A permission string (e.g.: ``user:create'`).
2. A tuple with a permission string and a request-parameter object (e.g.: `['user:update', { userId: 'id' }]`).
3. A conditional authorization object (e.g. `{ and: ['user:create', { or: ['user:list', 'user:read'] }] }`). This object can contain either `'and'` or `'or'` as key, and the value should be an array of at least items; each of which can be a permission string, tuple, or conditional authorization object.

### Permissions Validator

A permissions validator is also provided to validate the permission strings available in the consuming application.

#### Usage

The permissions validator `IsPermission` can be used as follows:

```ts
export class UpdateUserPermissionsDto {
  @IsArray()
  @IsPermission({ each: true })
  readonly permissions!: string[];
}
```

The above will validate the permissions provided with the ones available within the application.
