# Client

This application is the one used by the ultimate end-user of the application - i.e.: the consumer / `User`.

## General

[Helmet](https://docs.nestjs.com/security/helmet) and [CORS](https://docs.nestjs.com/security/cors) have been setup in this application. See the `main.ts` file for more details.

### Authentication

See the authentication library module, and the client's authentication module for more details.

### Password-Confirmation

See the authentication library module, and the client's authentication module for more details.

### Password-Reset

See the password-reset library module, and the client's password-reset module for more details.

### Health-Check

The client's health-check route is located at `/_health-check`. See the health-check controller for more details.

### Commands

A **CLI** script is available at the following command:

```shell
yarn run cli:client ...
```

#### Database

##### Drop

To drop the client database, run the following command:

```shell
yarn run cli:client db drop
```

#### Seed

To seed the client database, run the following command:

```shell
yarn run cli:client db seed
```

### Health-check

A health-check route is available at `/_health-check`. More health-check services can be added to the `HealthCheckController`'s `check` method.
See [NestJs health-check](https://docs.nestjs.com/recipes/terminus) for more details.

### Miscellaneous

If you are encountering assets errors (the .mjml.mustache files not being copied in the development environment), it's most probably due to the development server not being started using the proper command.
To properly start the development server, you need to specify `client` in the start command. E.g.:

```shell
yarn run start:dev client
```
