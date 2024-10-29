# Client

This application is the one used by the ultimate end-user of the application - i.e.: the consumer / `User`.

### Authentication

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
