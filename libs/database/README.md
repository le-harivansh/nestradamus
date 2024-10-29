# Database Library

This library exposes the `DatabaseModule` which is used to register a [MongoDB](https://www.mongodb.com) database into the consuming application.

The following injection tokens (see [custom providers](https://docs.nestjs.com/fundamentals/custom-providers)) are also provided:

- `MONGO_CLIENT` which is used to inject the `MongoDB Client` into the consuming class.
- `DATABASE` which is used to inject the `Database` into the consuming class.

### Configuration

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
}),
```
