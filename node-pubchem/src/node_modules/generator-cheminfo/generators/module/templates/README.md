# <%= name %>

  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]<% if (codecov) { %>
  [![Test coverage][codecov-image]][codecov-url]<% } %>
  [![npm download][download-image]][download-url]

<%= description %>.

## Installation

`$ npm install --save <%= npmName %>`

## Usage

```js
import library from '<%= npmName %>';

const result = library(args);
// result is ...
```

## [API Documentation](https://<%= org %>.github.io/<%= name %>/)

## License

  [MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/<%= npmName %>.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/<%= npmName %>
[travis-image]: https://img.shields.io/travis/<%= org %>/<%= name %>/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/<%= org %>/<%= name %><% if (codecov) { %>
[codecov-image]: https://img.shields.io/codecov/c/github/<%= org %>/<%= name %>.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/<%= org %>/<%= name %><% } %>
[download-image]: https://img.shields.io/npm/dm/<%= npmName %>.svg?style=flat-square
[download-url]: https://www.npmjs.com/package/<%= npmName %>
