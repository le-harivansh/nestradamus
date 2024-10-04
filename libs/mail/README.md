# Mail Library

This library is used to send e-mails. It exposes the `MailModule`, and `MailService`.

[MJML](https://mjml.io) & [Mustache](https://github.com/janl/mustache.js) are used to compose the e-mail.

### Configuration

The module can be configured as follows:

```js
MailModule.forRootAsync({
  useFactory: () => ({
    host: 'localhost',
    port: 1025,
    authentication: {
      username: 'nestradamus',
      password: 'nestradamus',
    },
    default: {
      from: {
        name: 'Nestradamus Team',
        address: 'test@nestradamus.dev',
      },
    },
  }),
  isGlobal: true,
});
```

### Send e-mail

An e-mail can be sent as follows:

```js
await mailService
  .mail()
  .from('sender@email.dev')
  .to('recipient@email.dev')
  .cc('cc@email.dev')
  .bcc('bcc@email.dev')
  .subject('E-mail subject')
  .mjml('<...mjml template...>', { key: 'value' })
  .send();
```
