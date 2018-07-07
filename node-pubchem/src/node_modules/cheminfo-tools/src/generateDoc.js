'use strict';

const child_process = require('mz/child_process');
const fs = require('mz/fs');
const inquirer = require('inquirer');
const path = require('path');

module.exports = function *generateDoc(publish) {
    const hasDoc = yield fs.exists('docs');
    let wantsDoc = true;
    if (!hasDoc) {
        console.log('This project has no docs folder');
        wantsDoc = (yield inquirer.prompt({
            type: 'confirm',
            name: 'c',
            message: 'Do you want to create it',
            default: false
        })).c;
    }
    if (wantsDoc) {
        const documentationExecPath = path.resolve(__dirname, '../node_modules/.bin/documentation');
        const pkg = require(process.cwd() + '/package.json');
        const main = pkg.module || pkg.main || '';
        yield child_process.exec(`${documentationExecPath} build ${main} --github --output docs --format html --sort-order alpha`);
        if (publish) {
            yield child_process.exec('git add docs');
            yield child_process.exec('git commit -m "doc: rebuild docs [ci skip]"');
            yield child_process.exec('git push origin master');
        }
    }
};
