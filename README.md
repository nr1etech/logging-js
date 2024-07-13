# Logging

[![NPM Version][npm-image]][npm-url]
[![TypeScript Style Guide][gts-image]][gts-url]
[![GitHub Actions][github-image]][github-url]

Provides a simple logging interface for typescript projects that
adheres to the NR1E logging standard.

To install using `pnpm`

```bash
pnpm i @nr1e/logging
```

## How to use

Initialize logging in your application.

```typescript
import * as logging from '@nr1e/logging';

// Only needs to be performed once
logging.initialize({
    level: 'info',
    svc: 'my-service',
});
```

This only needs to be done once. Additional calls to initialize will have no effect.

In your modules, get a named logger

```typescript
import * as logging from '@nr1e/logging';

const log = logging.getLogger('my-module');
```

To log a message

```typescript
log.info('Just another day in the life of a logger');
```

To log a message with a context

```typescript
log.info({foo: 'bar'}, 'Just another day in the life of a logger');
```

You can also log nested objects

```typescript
log.info(
    {foo: 'bar', nested: {foo: 'bar'}},
    'Just another day in the life of a logger',
);
```

To log a message using string interpolation

```typescript
log.info('Just another day in the life of a logger with %s', 'interpolation');
```

To log an error

```typescript
catch (err) {
    log.error(err, 'An error occurred');
}
```

To log an error with additional context

```typescript
catch (err) {
    log.error(err, {foo: 'bar'}, 'An error occurred');
}
```

Be aware, your error must be named 'err' in the context for the error to be logged.

## Angular Projects

If you are trying to use this library with Angular, you will need to add the
`os-browserify` package to your project.

```bash
pnpm i --save-dev os-browserify
```

Then add the following to your `angular.json` file inside `compilerOptions`

```
{
  ...
  compilerOptions: {
    ...
    "paths": {
      "os": [
        "./node_modules/os-browserify"
      ]
    }
  }
}
```

[github-url]: https://github.com/nr1etech/logging-js/actions
[github-image]: https://github.com/nr1etech/logging-js/workflows/ci/badge.svg
[npm-url]: https://npmjs.org/package/@nr1e/logging
[npm-image]: https://img.shields.io/npm/v/@nre1/logging-js.svg
[gts-image]: https://img.shields.io/badge/code%20style-google-blueviolet.svg
[gts-url]: https://github.com/google/gts
