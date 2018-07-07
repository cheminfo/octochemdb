# cheminfo-tools

CLI tools to help cheminfo developers

## Installation

`$ npm install -g cheminfo-tools`

This will add a new `cheminfo` command to your system.

## Sub-commands

### build

Make a browser build using webpack

#### options

* **-c, --cwd**: directory of the project to build. Default: current working directory
* **-o, --out**: directory where to put the build files. Default: dist
* **-n, --out-name**: name of the output file. Default: name of npm package or `bundle`
* **-r, --root**: root name of the library. Default: name of npm package (camelCase)
* **-e, --entry**: entry point of the library. Default: main field of npm package or index.js
* **-b, --babel**: enable babel loader for ES6 features
* **-u, --no-uglify**: disable generation of min file and source map
* **--no-source-map**: disable generation of source map only
* **-v, --verbose**: output warnings if any

### doc

Generate and/or publish documentation.  
It will be generated in the `doc` directory.

#### options

* **-p, --publish**: publish the generated doc to gh-pages

### publish

Test, bump and publish a project on npm.  
You need to run the command from the root of the project's directory. It is __only__ for npm-only packages. Please use the GRM for browser packages.

Usage: `cheminfo publish -o <org> -b <version>`

`-o` and `-b` are optional values and are determined automaticaly.

#### Example

`cheminfo publish -o cheminfo -b major`

This will:
* Run the tests
* Bump the version number to the next major
* Update the history file
* Publish on npm
* Add admins from the cheminfo organization to npm owners
* Create documentation and publish it in gh-pages (optional)
* Push the changes to GitHub

### generate

Generates a basic project structure based on the giving organization. You need to run the command from the root of the project's directory (previously you had to create it and clone it).

Usage: `cheminfo generate [options]`

#### Options

* **-u, --url**: git url to clone an existing repository

#### Example

`cheminfo generate ml`

The generator will prompt for the next fields:

  * __Your project name__: the package name, without the `ml-` start for ml.js organization
  * __Organization__: choose the desired organization, the supported ones are __ml__ and __cheminfo-js__
  * __Your name__: your [NPM name](https://docs.npmjs.com/files/package.json#people-fields-author-contributors)
  * __Your email__: your email
  * __Your package description__: A description to show in [NPM](https://docs.npmjs.com/files/package.json#description-1)
  * __Your package version__: The package version. The default value is `0.0.1`
  * __Do you want to install coverage tool?__: Add the coveralls badge and scripts. The default value is `false`
  * __Do you want to create a Runkit file example?__: Add the example displayed in NPM. The default value is `false`
  * __Run NPM install?__: Run `npm install` after the template generation

When the generator finish there will be the following files:

```
.
├── .eslintrc.yml
├── .gitignore
├── .travis.yml
├── History.md
├── LICENSE
├── README.md
├── package.json
├── runkit.js
├── src
│   └── index.js
└── test
    ├── .eslintrc.yml
    └── test.js
```

## Fast creation of a project using yo and cheminfo

install `hub`
```
npm install --global yo generator-cheminfo cheminfo-tools
mkdir ABC
cd ABC
yo cheminfo
hub init
hub create cheminfo-js/ABC
git add -A
git commit -m 'first commit'
hub push origin master
```

Alternative templates:
* `yo cheminfo:module` ES6 module (import / export)
* `yo cheminfo:lerna-module`
* `yo cheminfo:typescript`


### publish

```
cheminfo publish
```

If you want your package to be private, add in `package.json`
```
"private": true,
```

## License

  [MIT](./LICENSE)
