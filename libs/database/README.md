# Database Library

This library exposes the `DatabaseModule` which is used to register a [MongoDB](https://www.mongodb.com) database into the consuming application.

The following injection tokens (see [custom providers](https://docs.nestjs.com/fundamentals/custom-providers)) are also provided:

- `MONGO_CLIENT` which is used to inject the `MongoDB Client` into the consuming class.
- `DATABASE` which is used to inject the `Database` into the consuming class.

## Configuration

The configuration options are documented in the `database.module-options.ts` file. The module can be configured as follows:

```ts
DatabaseLibraryModule.forRootAsync({
  inject: [ConfigurationService],
  useFactory: (configurationService: ConfigurationService) => ({
    scheme: configurationService.getOrThrow('database.scheme'),
    host: configurationService.getOrThrow('database.host'),
    port: configurationService.getOrThrow('database.port'),
    username: configurationService.getOrThrow('database.username'),
    password: configurationService.getOrThrow('database.password'),
    databaseName: configurationService.getOrThrow('database.name'),

    applicationName: configurationService.getOrThrow('application.name'),
  }),

  // Extra options.
  isGlobal: true,
});
```

## Validators

This module also exposes some [custom `class-validator` validators](https://github.com/typestack/class-validator?tab=readme-ov-file#custom-validation-classes).

### Configuration

To be able to use the validators, we need to [configure](https://github.com/typestack/class-validator?tab=readme-ov-file#custom-validation-classes) `class-validator` to use the NesjJs service container. This is done by adding the following to the `main.ts` file of the application:

```ts
useContainer(application.select(ApplicationModule), {
  fallbackOnErrors: true,
});
```

### Existence Validator-Factory

The following existence validator-factory is exposed by this module.

#### `existenceValidatorFactory`

This validator-factory creates a validator which validates the existence or non-existence of a particular field-value in a collection.

##### Setup

We need to provide the validator-factory with a map of the models and the associated schema name; as well as whether we are checking for the existence or absence of the specified value.

e.g.: We would create two validators checking for the existence or absence of the specified value as follows:

```ts
const modelCollectionMap = new Map([
  [User, 'user-collection'],
  [PasswordReset, 'password-reset-collection'],
]);

export const ShouldExist = existenceValidatorFactory(modelCollectionMap, true);
export const ShouldNotExist = existenceValidatorFactory(
  modelCollectionMap,
  false,
);
```

##### Usage

e.g.: We would then use the created validators as follows:

```ts
export class DoSomethingDto {
  @ShouldExist(User) // the second argument will implicitly be 'email'
  readonly email!: string;

  @ShouldNotExist(User) // the second argument will implicitly be 'password'
  readonly password!: string;
}

// OR

export class DoSomethingDto {
  @ShouldExist(User, 'email') // explicitly specifying the second argument
  readonly email!: string;

  @ShouldExist(User, 'password') // explicitly specifying the second argument
  readonly password!: string;
}
```

Note: The created validator accepts an optional second argument; which is the name of the field to query in the specified collection. If not specified, it defaults to the name of the property on which it is used.
