# chdir-promise

> Change current working folder by returning a promise + a stack of folders to jump back

[![NPM][chdir-promise-icon] ][chdir-promise-url]

[![Build status][chdir-promise-ci-image] ][chdir-promise-ci-url]
[![semantic-release][semantic-image] ][semantic-url]

```js
var chdir = require('chdir-promise');
// only has two methods: chdir.to and chdir.from (alias chdir.back)
chdir.to('foo/bar/folder')
    // do something inside foo/bar/folder
    .then(chdir.back) // or chdir.from
    .done();
```

if you need to return value before returning use `.tap` method

```js
chdir.to('foo/bar/folder')
    .then(function () {
        return 'foo'; // value to return
    })
    .tap(chdir.back);
    // resolved with value 'foo'
```

Implemented using [q][q], [spots][spots], [lazy-ass][lazy-ass] and
[check-more-types][check-more-types].

**Advice**

Put `chdir.back` into `.finally` callback to make sure it is always executed, even if there is an exception.

```js
chdir.to('foo/bar/folder')
    .then(function () {
        throw new Error('oh my');
    })
    .then(chdir.back) // not called!
    .finally(chdir.back); // called
```

[q]: https://www.npmjs.com/package/q
[spots]: https://www.npmjs.com/package/spots
[lazy-ass]: https://www.npmjs.com/package/lazy-ass
[check-more-types]: https://www.npmjs.com/package/check-more-types

### Small print

Author: Gleb Bahmutov &copy; 2014

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](https://glebbahmutov.com)
* [blog](https://glebbahmutov.com/blog/)

License: MIT - do anything with the code, but don't blame me if it does not work.

Spread the word: tweet, star on github, etc.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/chdir-promise/issues?state=open) on Github

## MIT License

Copyright (c) 2014 Gleb Bahmutov

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

[chdir-promise-icon]: https://nodei.co/npm/chdir-promise.svg?downloads=true
[chdir-promise-url]: https://npmjs.org/package/chdir-promise
[chdir-promise-ci-image]: https://travis-ci.org/bahmutov/chdir-promise.svg?branch=master
[chdir-promise-ci-url]: https://travis-ci.org/bahmutov/chdir-promise
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
