# Nestradamus

This application is intended to be used as a starting point for web projects.

## General

While NestJs provides a solid framework to start with, common features such as authentication, registration, ACL, etc... are not provided out of the box.
This project provides an opinionated take on some of the commonly used features in web applications.

### Features

The following features are provided in this project:

- User registration
- User authentication
- Queuing
- Mailing

### Package management

Package management is done using the [Plug 'n' Play](https://yarnpkg.com/features/pnp) feature of [Yarn berry](https://yarnpkg.com).

Therefore, the dependencies of the project are commited with the project. In essence, to install the application, the project need only be
cloned, and the dependencies - built. i.e.:

```shell
git clone
cd nestradamus
yarn
```

### Development environment

The following have been set-up in the development environment:

- Containers are managed using [docker compose](https://docs.docker.com/compose)
- Git hooks are managed using [husky](https://typicode.github.io/husky)
- Linting & formatting is _managed_ using [lint-staged](https://github.com/lint-staged/lint-staged)
- Linting is _done_ using [eslint](https://eslint.org)
- Formatting is _done_ using [prettier](https://prettier.io)

#### Containers

The following containers are provided, and used, by the project:

- [mongo](https://hub.docker.com/_/mongo) - as the database of the application
- [redis](https://hub.docker.com/_/redis) - as the queuing database
- [mailhog](https://github.com/mailhog/MailHog) - for catching emails sent by the application

##### Environment variables

Environment variables for the containers are pulled from the project's `.env` file found in the root directory of the project. During testing the `.env.test` is used; and a `.env.example` file is provided for reference.

#### Prettier

[Prettier](https://prettier.io) uses [@trivago/prettier-plugin-sort-imports](https://github.com/trivago/prettier-plugin-sort-imports) to sort import order.

#### Path alias

Path aliases have been set in the project:

- `@` points to `src`
- `@cli` points to `cli`

_Note_: When setting path aliases; they need to be added to the `paths` section of the `tsconfig.json` file, **AND** to the `moduleNameMapper` section in any [jest](https://jestjs.io) configuration file.

### Todos

The project's tasks & todos are stored in the `todo.md` file, found in the root directory of the project.

@todo: admin + e2e tests

## Installation

1. Clone the project

```shell
git clone git@github.com:le-harivansh/nestradamus.git
```

2. Go into the project directory

```shell
cd nestradamus
```

3. Build the dependencies

```shell
yarn
```

## Run (development)

1. Go into the project directory

```shell
cd nestradamus
```

2. Create a new `.env` file (from the provided `.env.example` file)

```shell
cp .env.example .env
```

3. _(optional)_ Change the environment variables in the new `.env` file according to your preferences

4. _(optional)_ Generate new keys

```shell
yarn run key:generate
```

5. Start the docker containers

```shell
docker compose up
```

6. _(optional)_ Seed the database

```shell
yarn run db:seed
```

7. Start the project

```shell
yarn run start:dev
```

## Test

Tests are run using [jest](https://jestjs.io).

The application has the following test suites:

| Command                  | Test type | Description                          |
| ------------------------ | --------- | ------------------------------------ |
| `yarn run test:unit`     | Unit test | Run unit tests for the application   |
| `yarn run test:cli:unit` | Unit test | Run unit tests for the cli           |
| `yarn run test:e2e`      | E2E test  | Run e2e tests for the application    |
|                          |           |                                      |
| `yarn run test:all`      | All tests | Run all the tests of the application |

#### Test configuration

The E2E test configuration is expected to be in a `.env.test` file. You create a new `.env.test` file by copying the `.env.example` file, and changing any environment variable as needed.

### Unit tests

Unit tests are stored in `.spec.ts` files next to the files under test.

To run the unit tests, run the following commands:

1. Application unit tests:

```shell
yarn run test:unit
```

2. CLI unit tests:

```shell
yarn run test:cli:unit
```

#### Testing services

CRUD services that make heavy use of the database should use [MongooseMemoryServer](https://github.com/nodkz/mongodb-memory-server) - because it makes the tests more expressive, and easier to integrate than mocks.

### E2E tests

E2E tests are stored in `.test.ts` files in the `test` directory found at the root of the project.

To run the E2E tests, do the following:

1. Make sure a `.env.test` file exists (or create one using `.env.example` as a starting point)

```shell
cp .env.example .env.test
```

2. Start the application dependencies (using `.env.test` as the environment file)

```shell
docker compose up --env-file .env.test
```

3. Run the E2E tests

```shell
yarn run test:e2e
```

#### Sequencing

E2E tests are run sequentially, and are sequenced according to their filenames. It is therefore recommended to prefix the E2E test files with a number depicting their order to the test-runner.

See the `jest.sequencer.js` file for more details.

## Custom scripts

The application's custom scripts are stored in the `cli/script` directory, and are also present in the `scripts` section of the project's `package.json` file.

The following custom scripts are available:

| Script                             | `package.json` script | Description                  |
| ---------------------------------- | --------------------- | ---------------------------- |
| cli/script/seeder/script.ts        | `db:seed`             | Seeds the database           |
| cli/script/generate-keys/script.ts | `key:generate`        | Generate environment secrets |

### Database seeding

The database can be seeded using the `db:seed` command.

The _model factory_ & _database seed_ follows the same convention as [Laravel](https://laravel.com/docs/master/seeding).

#### Registering models to be seeded

To register a new model to be seeded by the seeder, do the following:

1. Create a factory for the model to be seeded (see `src/_application/_user/_user/factory/user.factory.ts`)
2. Register the factory **and** mongoose schema in `cli/script/seeder/_factory/factory.module.ts`
3. Call the relevant factory method in `cli/script/seeder/_seeder/seeder/database.seeder.ts`

## Configuring the application

The application is configured using a `.env` file. An example file: `.env.example` is provided, and contains all the necessary environment variables that the application needs.

You can just copy the `.env.example` file, and change any environment variable as needed.

```shell
cp .env.example .env
```

### Configuration registration

To add new configuration values to the application, the following need be done in order:

1. Add the relevant environment variables & values to the `.env` file.
2. Add the relevant typings to the `environment.d.ts` module (found in the root directory of the project).
3. Create a new `<module-name>.config.ts` file to validate the new environment variable values pulled from the `.env` file.
4. Register the default export of the `<module-name>.config.ts` file in the module via `ConfigModule::forFeature`.
5. Add the relevant namespace & configuration type to the `NamespacedConfigurationType` in the `type.ts` file of the `ConfigurationModule`.

## Module configuration

Environment variables are sourced into the application through module configurations. The module configurations are - in turn - validated against a pre-defined schema. Configuration files typically live in the modules that "own" them. For an example of a module configuration, see `src/_application/application.config.ts`.

### Adding new configuration values

To add a new module configuration to the application, the following needs to be done:

1. Add the necessary (if any) environment variables to `.env.example` - for easier environment file creation, and to the relevant environment file(s) (`.env`, `.env.test`, and/or other environment file(s)).
2. Register the environment variables in `environment.d.ts`.
3. Create a `<module>.config.ts` configuration file in the module (see `src/_application/application.config.ts` for reference).
4. Register the configuration from the newly created configuration file in the module (using `ConfigModule::forFeature`).
5. Register the configuration types in `src/_application/_configuration/type.ts`.

### Retrieving configuration values

To retrieve configuration values, the `ConfigurationService` class - from `src/_application/_configuration/service` should be used.

It does not need to be imported into the consuming module prior to usage, as it is exported from the [global module](https://docs.nestjs.com/modules#global-modules): `ConfigurationModule`.

## Logging

Logging in the application is done using [winston](https://github.com/winstonjs/winston) through the `src/_application/_logger` module.

The `WinstonLoggerService` should be used to create the logs in the application. It does not need to be imported into the consuming module prior to usage, as it is exported from the [global module](https://docs.nestjs.com/modules#global-modules): `LoggerModule`.

## Healthcheck

The application also offers healthcheck information at `/_health`. The [terminus](https://docs.nestjs.com/recipes/terminus) module is used for the healthcheck feature within the application.

## General conventions

- Any application-related feature definition or module should be defined in the `src/_application` module.
- Module names should start with an underscore (e.g.: `_authentication`).
- Time-related environment variables should conform to, and be parsed with `ms`.
- All time-related configuration values should be ultimately transformed to milliseconds (this is normally done with `ms`).
- Application E2E test files should start with a number.
- File & module names are **NOT** pluralized - _unless_ there is a very good reason to.
- Configuration keys found in `ConfigurationService` should be in camelCase.

## Branches

The project has the following branches:

- `main`: The stable branch.
- `development`: The branch where development occurs.

## Administration Section

The application has an administration 'section' which is accessible at [admin.application.local]. This can be changed through the `HOST` constant found in the `src/_administration/constant.ts` file.

**Note**: Any new controllers & routes that are being registered in the administration section should use the host (`HOST`) defined in the aforementioned file.

## Authentication

Authentication in the application is done using [JSON Web Tokens](https://en.wikipedia.org/wiki/JSON_Web_Token).

### Access-Token

To enable authentication for a route, it needs to be decorated with the `Requires...AccessToken` (`RequiresUserAccessToken` or `RequiresAdministratorAccessToken`) guard.
To authenticate a request guarded with `Requires...AccessToken`, the following needs to be done:

1. Request an _access-token_ from the `/login` route - for the relevant section (administration or user). An _access-token_ & a _refresh-token_ will be returned.
2. To authenticate a request to the guarded route, add the _access-token_ to the specified header on the request (currently: `user.access-token` for users and `administrator.access-token` for administrators).

### Refresh-Token

To require a _refresh-token_ for a route, it needs to be decorated with the `Requires...RefreshToken` (`RequiresUserRefreshToken` or `RequiresAdministratorRefreshToken`) guard. To authenticate a request guarded with `Requires...RefreshToken`, the following needs to be done:

1. Request a _refresh-token_ from the `/login` route - for the relevant section (administration or user). An _access-token_ & a _refresh-token_ will be returned.
2. To authenticate a request to the guarded route, add the _refresh-token_ to the specified header on the request (currently: `user.refresh-token` for users and `administrator.refresh-token` for administrators).

## Throttling

Request to the application is throttled according to the values set to the `APPLICATION_THROTTLER_TTL` and `APPLICATION_THROTTLER_REQUEST_LIMIT`.
The application uses the [rate-limiting](https://docs.nestjs.com/security/rate-limiting) feature of NestJs to control throttling.

## Queues

[Queuing](https://docs.nestjs.com/techniques/queues) in the application is done through the [bull](https://optimalbits.github.io/bull) module.
See `src/_application/_queue/queue.module.ts` for the configuration of the aforementioned in the application.

## Mail

E-mailing in the application is done using [nodemailer](https://nodemailer.com). Any and all mail sending should be done through the `MailService` which is registered in `src/_application/_mail/service/mail.service.ts`.

Mails can be sent immediately, or they can be queued to be sent once a worker is available to process them.

## Serialization

Raw mongodb documents should be serialized if they are being returned in a response. An interceptor-serializer `SerializeDocumentHavingSchema` (in: `src/_library/interceptor/mongoose-document-serializer.interceptor.ts`) has been provided for this use-case.

## Miscellaneous

1. After upgrading packages in the project (using `yarn upgrade-interactive`) - if you encounter issues (usually after upgrading typescript); you need to upgrade yarn, and its SDK. See [this issue](https://github.com/yarnpkg/berry/issues/4872#issuecomment-1284318301).

```shell
yarn set version stable
yarn dlx @yarnpkg/sdks vscode
```
