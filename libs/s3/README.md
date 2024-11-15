# S3 Library

This library exposes the `S3Module`, and `S3Service` class that uploads a file to S3, and allows for the user to get a pre-signed url to be able to view the uploaded file.

## Configuration

The following is an example configuration used to register this module in a (NestJs)[https://docs.nestjs.com] application:

```ts
S3LibraryModule.forRootAsync({
  inject: [ConfigurationService],
  useFactory: (configurationService: ConfigurationService) => ({
    aws: {
      credentials: {
        accessKey: configurationService.getOrThrow(
          's3.aws.credentials.accessKey',
        ),
        secretKey: configurationService.getOrThrow(
          's3.aws.credentials.secretKey',
        ),
      },
      region: configurationService.getOrThrow('s3.aws.region'),
      bucketName: configurationService.getOrThrow('s3.aws.bucketName'),
      endpoint:
        configurationService.getOrThrow('application.environment') ===
        'development'
          ? configurationService.getOrThrow('s3.aws.endpoint.development')
          : undefined,
    },
  }),

  isGlobal: true,
});
```

### Custom Endpoint

If you are using a S3-compatible service that is not AWS S3, you can specify a custom endpoint where the service can be reached.
This is normally used when developing locally using another S3-compatible service such as [MinIO](https://min.io).

## `S3Service`

This class exposes the following methods:

- `uploadFile` which accepts the file to be stored on S3, and the prefix for the object key. It then returns the key used to store the file on S3 - which is the concatenation of the key-prefix, and a generated UUID (v4).
- `getPresignedUrl` which accepts the key of the file to access, and the duration the link should be valid for; and returns the pre-signed url which can be used to access the specified file.

Note: The files stored on S3 using this service are private; which is why the `getPresignedUrl` key is required to retrieve them.
