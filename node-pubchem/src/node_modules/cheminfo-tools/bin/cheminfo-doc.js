#!/usr/bin/env node

'use strict';

const program = require('commander');
const co = require('co');

const generateDoc = require('../src/generateDoc');
const util = require('../src/util');

program
    .option('-f, --force', 'allows to bypass some checks')
    .option('-p, --publish', 'publish the doc to gh-pages');

program.parse(process.argv);

const force = program.force;

co(function *(){

    const shouldStop = yield util.checkLatestVersion(force);
    if (shouldStop) return;

    yield generateDoc(program.publish);

}).catch(function (err) {
    console.error(err);
});
