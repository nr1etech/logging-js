# Logging

[![NPM Version][npm-image]][npm-url]
[![TypeScript Style Guide][gts-image]][gts-url]
[![GitHub Actions][github-image]][github-url]

Provides a simple logging interface for typescript projects that
adheres to the NR1E logging standard. The goal of this wrapper is to
reduce CPU and memory overhead by only formatting log messages when
the log level is set to a level that would allow the message to be logged.

To install using `pnpm`

```bash
pnpm i @nr1e/logging
```

## How to use

Initialize logging in your application.

```typescript
import * as logging from '@nr1e/logging';

// This only needs to be performed once
logging.initialize({
    svc: 'my-service',
    level: 'info',
});
```

To obtain a named child logger of the root logger

```typescript
const log = logging.getLogger('my-module');
```

To obtain a named child logger of another logger

```typescript
const log = logging.getLogger('my-module', parentLogger);
```

To log an info message

```typescript
log.info().msg('Just another day in the life of a logger');
```

To log a message with a context

```typescript
log.info().obj({foo: 'bar'}).msg('Just another day in the life of a logger');
```

You can also log nested objects

```typescript
log.info().obj({foo: 'bar', nested: {foo: 'bar'}}).msg('Just another day in the life of a logger');
);
```

To log an error

```typescript
try {
    throw new Error('An error occurred');
} catch (err) {
    log.error().err(err).msg('Human sacrifice, dogs and cats living together... MASS HYSTERIA!');
}
```

To log an error with additional context

```typescript
try {
    throw new Error('An error occurred');
} catch (err) {
    log.error().err(err).obj({foo: 'bar'}).msg('Human sacrifice, dogs and cats living together... MASS HYSTERIA!');
}
```

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
[npm-url]: https://npmjs.com/package/@nr1e/logging
[npm-image]: https://img.shields.io/npm/v/@nre1/logging.svg
[gts-image]: https://img.shields.io/badge/code%20style-google-blueviolet.svg
[gts-url]: https://github.com/google/gts
