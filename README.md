# Nestradamus

This application is intended to be used as a starting point for web projects.

## General

While NestJs provides a solid framework to start with, common features such as authentication, registration, ACL, etc... are not provided out of the box.
This project provides an opinionated take on some of the commonly used features in web applications.

### Features

The following features are provided in this project:

- User registration
- User authentication
- Password reset

### Package management

Package management is done using the [Plug 'n' Play](https://yarnpkg.com/features/pnp) feature of [Yarn berry](https://yarnpkg.com).

Therefore, the dependencies of the project are commited with the project. In essence, to install the application, the project need only be
cloned, and the dependencies - built. i.e.:

```shell
git clone git@github.com:le-harivansh/nestradamus.git
cd nestradamus
yarn
```

### Development environment

The following have been set-up in the development environment:

- Containers are managed using [docker compose](https://docs.docker.com/compose)
- Git hooks are managed using [husky](https://typicode.github.io/husky)
- Linting is _done_ using [eslint](https://eslint.org)
- Formatting is _done_ using [prettier](https://prettier.io)
- Linting & formatting is _managed_ using [lint-staged](https://github.com/lint-staged/lint-staged)

#### Containers

The following containers are provided, and used, by the project:

- [database](https://hub.docker.com/_/mongo) - as the database of the application (using mongodb)
- [mailpit](https://mailpit.axllent.org) - as the SMTP server (& mail-catcher) of the application

##### Environment variables

Environment variables for the containers are pulled from the project's `.env` file found in the root directory of the project - as well as the relevant application's `.env` file found in the root directory of the application. During testing the `.env.test` for the relevant application is used; and a `.env.example` file is provided for reference.

#### Prettier

[Prettier](https://prettier.io) uses [@trivago/prettier-plugin-sort-imports](https://github.com/trivago/prettier-plugin-sort-imports) to sort import order.

#### Path alias

See the `tsconfig.json` file for all of the aliases setup in the project. There is an alias for every library defined in the application.

_Note_: When setting path aliases; they need to be added to the `paths` section of the `tsconfig.json` file, **AND** to the `moduleNameMapper` section in any [jest](https://jestjs.io) configuration file.

### Todos

The project's tasks & todos are stored in the `todo.md` file, found in the root directory of the project.

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

2. Create a new `.env` file (see the provided `.env.example` file for all of the required environment variables)

- This should be done for the root `.env` file, as well as for every `.env` file defined in each of the apps.

```shell
cp .env.example .env
```

3. _(optional)_ Change the environment variables in the new `.env` file according to your preferences

4. Start the docker containers

```shell
docker compose up
```

5. Start the specific application.

```shell
yarn run start:dev client # <-- to start the `client` application
yarn run start:dev administration # <-- to start the `administration` application
```

## Test

Tests are run using [jest](https://jestjs.io).

The application has the following test suites:

| Command              | Test type | Description                        |
| -------------------- | --------- | ---------------------------------- |
| `yarn run test:unit` | Unit test | Run unit tests for the application |
| `yarn run test:e2e`  | E2E test  | Run e2e tests for the application  |

#### Test configuration

The E2E test configuration (for every defined application) is expected to be in a `.env.test` file. You create a new `.env.test` file by copying the `.env.example` file, and changing any environment variable as needed.

### Unit tests

Unit tests are stored in `.spec.ts` files next to the files under test.

To run the unit tests, run the following commands:

```shell
yarn run test:unit
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

2. Run the E2E tests

```shell
yarn run test:e2e
```

#### Sequencing

E2E tests are run sequentially, and are sequenced according to their filenames. It is therefore recommended to prefix the E2E test files with a number depicting their order to the test-runner.

See the `jest.sequencer.js` file for more details.

## Configuring the application

The application is configured using a `.env` file. An example file: `.env.example` is provided, and contains all the necessary environment variables that the application needs.

You can just copy the `.env.example` file, and change any environment variable as needed.

```shell
cp .env.example .env
```

### Configuration registration

To add new configuration values to the application, the following need be done in order:

1. Add the relevant environment variables & values to the `.env` file.
2. Add the relevant typings to the `environment.d.ts` module (found in the root directory of the relevant application).
3. Create a new `<module-name>.config.ts` file to validate the new environment variable values pulled from the `.env` file.
4. Register the default export of the `<module-name>.config.ts` file in the module via `ConfigModule::forFeature`.
5. Add the relevant namespace & configuration type to the `NamespacedConfigurationType` in the `type.ts` file of the `ConfigurationModule` of the relevant application.

## Module configuration

Environment variables are sourced into the application through module configurations. The module configurations are - in turn - validated against a pre-defined schema. Configuration files typically live in the modules that "own" them. For an example of a module configuration, see `apps/client/src/src/application.config.ts`.

### Adding new configuration values

To add a new module configuration to the application, the following needs to be done:

1. Add the necessary (if any) environment variables to the application's `.env.example` - for easier environment file creation, and to the relevant environment file(s) (`.env`, `.env.test`, and/or other environment file(s)).
2. Register the environment variables in the application's `environment.d.ts`.
3. Create a `<module>.config.ts` configuration file in the module (see `apps/<application-name>/src/application.config.ts` for reference).
4. Register the configuration from the newly created configuration file in the module (using `ConfigModule::forFeature`).
5. Register the configuration types in `apps/<application-name>/src/_configuration/type.ts`.

## Miscellaneous

1. After upgrading packages in the project (using `yarn upgrade-interactive`) - if you encounter issues (usually after upgrading typescript); you need to upgrade yarn, and its SDK. See [this issue](https://github.com/yarnpkg/berry/issues/4872#issuecomment-1284318301).

```shell
yarn set version stable
yarn dlx @yarnpkg/sdks vscode
```
