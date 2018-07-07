#!/usr/bin/env node

'use strict';
require('tabtab')().start();
var program = require('commander');

var pkg = require('../package.json');
program.version(pkg.version);

program
    .command('build', 'build a project for the browser')
    .command('doc', 'generate and optionally publish documentation')
    .alias('docs')
    .command('publish', 'bump and publish a project on npm')
    .command('generate', 'generates a basic project structure');

program.parse(process.argv);
