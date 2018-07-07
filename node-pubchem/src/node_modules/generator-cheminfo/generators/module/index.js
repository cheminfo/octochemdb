'use strict';

const cp = require('child_process');
const path = require('path');

const camelCase = require('camelcase');
const chalk = require('chalk');
const which = require('which');
const Generator = require('yeoman-generator');
const yosay = require('yosay');

let username = ' ';
let email = ' ';

try {
  username = cp.execSync('git config user.name').toString();
  email = cp.execSync('git config user.email').toString();
} catch (e) {
  /* istanbul ignore next */
  console.error('Missing git configuration');
}

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(
      yosay(`Behold the almighty ${chalk.red('generator-cheminfo')} generator!`)
    );

    const prompts = [
      {
        type: 'input',
        name: 'name',
        message: 'Your project name',
        default: path.basename(this.destinationRoot()) // Default to current folder name
      },
      {
        type: 'input',
        name: 'org',
        message: 'GitHub organization',
        default: 'cheminfo'
      },
      {
        type: 'input',
        name: 'userName',
        message: 'Your name',
        default: username.substring(0, username.length - 1)
      },
      {
        type: 'input',
        name: 'email',
        message: 'Your email',
        default: email.substring(0, email.length - 1)
      },
      {
        type: 'input',
        name: 'description',
        message: 'Your package description'
      },
      {
        type: 'confirm',
        name: 'codecov',
        message: 'Do you want to install coverage tool?',
        default: false
      }
    ];

    return this.prompt(prompts).then(
      function(props) {
        // To access props later use this.props.name;
        this.props = props;
      }.bind(this)
    );
  }

  writing() {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const camelName = camelCase(this.props.name);
    const prefix = this.props.org === 'mljs' ? 'ml-' : '';
    const includes = {
      npmName: prefix + this.props.name,
      name: this.props.name,
      org: this.props.org,
      userName: this.props.userName,
      email: this.props.email,
      codecov: this.props.codecov,
      description: this.props.description,
      date: year + '-' + month + '-' + day,
      year: year,
      camelName: camelName
    };

    this.fs.copy(
      this.templatePath('babelrc'),
      this.destinationPath('.babelrc')
    );
    this.fs.copy(
      this.templatePath('eslintrc.yml'),
      this.destinationPath('.eslintrc.yml')
    );
    this.fs.copy(
      this.templatePath('gitignore'),
      this.destinationPath('.gitignore')
    );
    this.fs.copy(
      this.templatePath('rollup.config.js'),
      this.destinationPath('rollup.config.js')
    );
    this.fs.copy(
      this.templatePath('index.js'),
      this.destinationPath('src/index.js')
    );
    this.fs.copy(
      this.templatePath('test.js'),
      this.destinationPath('src/__tests__/test.js')
    );

    this.fs.copyTpl(
      this.templatePath('LICENSE'),
      this.destinationPath('LICENSE'),
      includes
    );
    this.fs.copyTpl(
      this.templatePath('README.md'),
      this.destinationPath('README.md'),
      includes
    );
    this.fs.copyTpl(
      this.templatePath('package'),
      this.destinationPath('package.json'),
      includes
    );
    this.fs.copyTpl(
      this.templatePath('travis.yml'),
      this.destinationPath('.travis.yml'),
      includes
    );
  }

  install() {
    let deps = [
      'babel-plugin-transform-es2015-modules-commonjs',
      'eslint',
      'eslint-config-cheminfo',
      'eslint-plugin-import',
      'eslint-plugin-jest',
      'jest',
      'npm-run-all',
      'rollup'
    ];

    if (this.props.codecov) {
      deps.push('codecov');
    }

    this.npmInstall(deps, { 'save-dev': true });
  }
};
