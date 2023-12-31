# Base NestJs Application with JWT Authentication

This is a base NestJs application with a fully configured development environment. A mongodb database connection has been setup, and the `compose.yaml` file provides a mongodb database configured for developing the application.

## Configuring the application

The application is configured using a `.env` file. An example file: `.env.example` is provided, and contains all the necessary environment variables that the application needs.

You can just copy the `.env.example` file, and change any environment variable as needed.

```shell
cp .env.example .env
```

### Configuration registration

To add new configuration values to the application, the following need be done in order:

1. Add the relevant environment variables & values to the `.env` file.
2. Create a new `<module-name>.config.ts` file to validate the new environment variable values pulled from the `.env` file.
3. Register the default export of the `<module-name>.config.ts` file in the module via `ConfigModule::forFeature`.
4. Add the relevant namespace & configuration type to the `NamespacedConfigurationType` in the `ConfigurationService` (which - in turn - is in `ConfigurationModule`).

### Test configuration

The test configuration is expected to be in a `.env.test` file. You create a new `.env.test` file by copying the `.env.example` file, and changing any environment variable as needed.

```shell
cp .env.example .env.test
```

**Note**: When running tests, the environment variables from `.env.test` should be used to configure the _docker containers_ if the environment variables for the containers differ between the environment files. As a consequence when testing the application, the containers need to be started using:

```shell
docker compose up --env-file .env.test
```

## Running the application

The following are instructions to start the application locally - for development purposes.

1. Start the application dependencies' containers.

```shell
docker compose up
```

2. Start the application

```shell
yarn run start:dev
```

## Scripts

The scripts related to the application are stored in: `cli/script`, and are also present in the `scripts` section the main `package.json` file.

The following scripts are available:

| Script                  | `package.json` script | Description                  |
| ----------------------- | --------------------- | ---------------------------- |
| seed.script.ts          | `db:seed`             | Seeds the database           |
| generate-keys.script.ts | `key:generate`        | Generate environment secrets |

## Model factories & Database seeds

The _model factory_ & _database seed_ follows the same convention as [Laravel](https://laravel.com/docs/master/seeding).
The model factories are stored in the `src/_application/_database/_factory` module, and the database seeders are stored in the `src/_application/_database/_seeder` module.

## Module configuration

Environment variables are sourced into the application through module configurations. The module configurations are - in turn - validated against a schema defined by the developer. Configuration files typically live in the modules that "own" them. For an example of a module configuration, see `src/_application/application.config.ts`.

## JWT authentication

A sample JWT authentication system has been setup in the application. It uses JWT tokens embedded in headers to authenticate requests to the application. See the `src/_authentication` module for more details.

## Testing

The application has the following test suites:

| Command                  | Test type | Description                        |
| ------------------------ | --------- | ---------------------------------- |
| `yarn run test:unit`     | Unit test | Run unit tests for the application |
| `yarn run test:cli:unit` | Unit test | Run unit tests for the cli         |
| `yarn run test:e2e`      | E2E test  | Run e2e tests for the application  |

**Note**: The application E2E tests are ordered/sequenced according to their filenames. They should therefore start with the number which describes their running order.

## Development environment

The project uses yarn berry for package management; husky for git-hooks; lint-staged for linting staged files; eslint for code linting; and prettier for code prettifying.

A `compose.yaml` file is provided, and contains the application container dependencies' definitions.

## Logging

Logging in the application is done using [winston](https://github.com/winstonjs/winston) through the `src/_application/_logger` module.

## Model factories & database seeding

Model factories should live in the module where their schemas are found. They should however be **registered** in the `factory` module - located at: `src/_application/_database/_factory`.

## General conventions

- Any application-related feature definition or module should be defined in the `src/_application` module.
- Module names start with an underscore (e.g.: `_authentication`).
- Time related environment variables should conform to, and be parsed with `ms`.
- Application E2E test files should start with a number.

## Branches

The project has the following branches:

- `main`: The stable branch.
- `development`: The branch where development occurs.
- (wip)`feat/user-with-email`: In this branch, the `User` model has an `email` field instead of a `username` field.
- (next) `feat/administration`: An administration section for the application - with authN, (authZ?), ...
