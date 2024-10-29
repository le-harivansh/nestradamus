# Mail Library

This library is used to send e-mails. It exposes the `MailModule`, and `MailService`.

[MJML](https://mjml.io) & [mustache](https://github.com/janl/mustache.js) can be used to compose the e-mail; and if so, [html-minifier](https://github.com/kangax/html-minifier) is used to minify the email, and [html-to-text](https://github.com/html-to-text/node-html-to-text) is used to create the text counterpart of the email.

### Configuration

The configuration options are documented in the `database.module-options.ts` file. The module can be configured as follows:

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

#### MJML + mustache

```js
await mailService
  .mail()
  .from('sender@email.dev')
  .to('recipient@email.dev')
  .cc('cc@email.dev')
  .bcc('bcc@email.dev')
  .subject('E-mail subject')
  .mjml('<...mjml template...>', { key: 'value' }) // <-- MJML template & mustache variables
  .send();
```

#### HTML + text

```js
await mailService
  .mail()
  .from('sender@email.dev')
  .to('recipient@email.dev')
  .cc('cc@email.dev')
  .bcc('bcc@email.dev')
  .subject('E-mail subject')
  .html('<...html template...>') // <-- HTML template
  .text('<...text template...>') // <-- text template
  .send();
```
