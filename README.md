# Logging JS

[![NPM Version][npm-image]][npm-url]
[![TypeScript Style Guide][gts-image]][gts-url]
[![GitHub Actions][github-image]][github-url]

This project provides a simple logging interface for typescript projects that
adheres to the NR1E logging standard.

To install using `pnpm`

```bash
pnpm i @nr1e/logging-js
```

## Angular Projects

If you are trying to use this library with Angular, you will need to add the
`os-browserify` package to your project.

```bash
pnpm i --save-dev os-browserify
```

Then add the following to your `angular.json` file inside `compilerOptions`

```json
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
[npm-url]: https://npmjs.org/package/@nr1e/logging-js
[npm-image]: https://img.shields.io/npm/v/@nre1/logging-js.svg
[gts-image]: https://img.shields.io/badge/code%20style-google-blueviolet.svg
[gts-url]: https://github.com/google/gts
