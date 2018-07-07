#!/usr/bin/env node

'use strict';

const program = require('commander');
const changelog = require('conventional-changelog');
const child_process = require('mz/child_process');
const co = require('co');
const concat = require('concat-stream');
const fs = require('mz/fs');
const git = require('ggit');
const inquirer = require('inquirer');
const path = require('path');
const recommendedBump = require('conventional-recommended-bump');
const request = require('request-promise');
const semver = require('semver');
const chalk = require('chalk');
const ERROR_COLOR = 'rgb(255,99,99)';

const generateDoc = require('../src/generateDoc');
const util = require('../src/util');

let version, org;

program
    .option('-b, --bump <bump>', 'kind of version bump')
    .option('-o, --org <org>', 'organization')
    .option('-f, --force', 'allows to bypass some checks')
    .option('-D, --no-doc', 'do not generate and publish documentation');

program.parse(process.argv);

const force = program.force;

co(function* () {

    const shouldStop = yield util.checkLatestVersion(force);
    if (shouldStop) return;

    const currentBranch = yield git.branchName();
    if (currentBranch !== 'master') {
        errorLog(`You must be on master branch. Current branch: ${currentBranch}`);
        return;
    }

    const hasChanges = yield git.hasChanges();
    if (hasChanges) {
        errorLog(`You have uncommitted changes.`);
        return;
    }

    yield git.exec('git pull --rebase');

    // Get npm username
    const name = parseName(yield execNpm('whoami'));

    const packageJSONPath = path.resolve('package.json');
    const packageLockPath = path.resolve(packageJSONPath, '../package-lock.json');
    const packageJSON = require(packageJSONPath);
    const hasPackageLock = yield fs.exists(packageLockPath);

    let org = program.org;
    if (!org) {
        org = util.getOrgFromPackage(packageJSON);
    }
    if (!org) {
        org = (yield inquirer.prompt({
            type: 'list',
            message: 'Choose an organization',
            name: 'org',
            choices: ['mljs', 'cheminfo']
        })).org;
    }

    // Get admin list for org
    if (org === 'cheminfo-js') {
        org = 'cheminfo';
    }
    const adminList = JSON.parse((yield execNpm(`team ls ${org}:developers`))[0]);
    if (adminList.indexOf(name) === -1) {
        errorLog(`Org (${org}) does not exist or you (${name}) are not allowed to publish in it`);
        return;
    }

    // Get the name of the package
    const packageName = packageJSON.name;
    const packageVersion = packageJSON.version;
    const bumpVersion = {
        major: semver.inc(packageVersion, 'major'),
        minor: semver.inc(packageVersion, 'minor'),
        patch: semver.inc(packageVersion, 'patch')
    };

    function formatToBump(type) {
        return `${type} (${bumpVersion[type]})`;
    }

    const toBump = yield getRecommendedBump();
    let bump = program.bump;

    if (bump && bump !== 'major' && bump !== 'minor' && bump !== 'patch') {
        errorLog(`Invalid bump type: ${bump}`);
        return;
    }

    console.log(`Current version: ${packageVersion}`);
    if (!bump) {
        console.log(`${toBump.reason}`);
        console.log(`Recommended bump: ${formatToBump(toBump.releaseType)}`);
        bump = (yield inquirer.prompt({
            type: 'list',
            name: 'bump',
            message: 'Confirm bump',
            choices: [
                {name: formatToBump('major'), value: 'major'},
                {name: formatToBump('minor'), value: 'minor'},
                {name: formatToBump('patch'), value: 'patch'}
            ],
            default: toBump.releaseType
        })).bump;
    } else if (bump !== toBump.releaseType) {
        console.log(`Recommended bump is ${formatToBump(toBump.releaseType)}.
You chose ${formatToBump(bump)} instead.`);
        const confirm = (yield inquirer.prompt({
            type: 'confirm',
            name: 'c',
            message: 'Are you sure',
            default: false
        })).c;
        if (!confirm) return;
    }

    // Execute the tests
    console.log('Running the tests');
    yield execNpm('run test');

    // Bump version
    console.log('Bumping version');
    const newVersion = bumpVersion[bump];
    const newVersionString = `"version": "${newVersion}"`;
    const versionReg = /"version": "[^"]+"/;

    let packData = yield fs.readFile(packageJSONPath, 'utf8');
    packData = packData.replace(versionReg, newVersionString);
    yield fs.writeFile(packageJSONPath, packData);

    if (hasPackageLock) {
        let packLockData = yield fs.readFile(packageLockPath, 'utf8');
        packLockData = packLockData.replace(versionReg, newVersionString);
        yield fs.writeFile(packageLockPath, packLockData);
    }

    // Add/update changelog
    yield updateHistory();

    // Commit the update and tag it
    yield child_process.exec('git add package.json History.md' + (hasPackageLock ? ' package-lock.json' : ''));
    yield child_process.exec(`git commit -m ${newVersion}`);
    yield child_process.exec(`git tag -a v${newVersion} -m v${newVersion}`);

    // Publish package
    console.log('Publishing package');
    var publishOutput;
    try {
        publishOutput = yield execNpm('publish');
    } catch (e) {
        errorLog('npm publish failed, rolling back commits and tags');
        yield child_process.exec(`git tag -d v${newVersion}`);
        yield child_process.exec('git reset --hard HEAD~1');
        return;
    } finally {
        log(publishOutput);
    }

    // Add to organization
    var packages;
    try {
        packages = JSON.parse((yield execNpm(`access ls-packages ${org}:developers`))[0]);
    } catch (e) {
        errorLog(`{${ERROR_COLOR} This team may not exist (${org}:developers)`);
    }

    if (!packages || !packages[packageName]) {
        console.log('Adding to organization');
        try {
            var addAdmins = yield execNpm(`access grant read-write ${org}:developers`);
            log(addAdmins);
        } catch (e) {
            console.log(chalk`{${ERROR_COLOR} You (${name}) are not allowed to grant permissions on this package.
Check that you are an admin on ${org} or ask the first author to run {bold.black.bgRgb(252,141,141) "npm access grant read-write ${org}:developers ${packageName}"}}`);
        }
    }

    // Push to GitHub
    console.log('Pushing to GitHub');
    try {
        log(yield child_process.exec('git push --follow-tags'));
    } catch (e) {
        errorLog(e);
        errorLog('Command "git push --follow-tags" failed.\nYou need to resolve the problem manually');
    }

    // Documentation
    if (program.doc) {
        yield generateDoc(true);
    }

}).catch(function (err) {
    errorLog(err);
});

function execNpm(command) {
    return child_process.exec(`npm ${command}`);
}

function parseName(name) {
    return name[0].substr(0, name[0].length - 1);
}

function log(result) {
    if (result[0]) process.stdout.write(result[0]);
    if (result[1]) process.stderr.write(result[1]);
}

function errorLog(err) {
    console.log(chalk.rgb(255, 99, 99)(err));
}

function getRecommendedBump() {
    return new Promise((resolve, reject) => {
        recommendedBump({preset: 'angular'}, function (err, result) {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

function* updateHistory() {
    const HISTORY_FILE = 'History.md';
    const changelogOptions = {
        preset: 'angular',
        releaseCount: 1
    };
    if (yield fs.exists(HISTORY_FILE)) { // File exists. Append latest version to current history.
        const newHistory = yield createChangelog(changelogOptions);
        if (newHistory.length === 0) {
            errorLog('No history to write. There must be a problem.');
            return;
        }
        const currentHistory = yield fs.readFile(HISTORY_FILE);
        const concat = Buffer.concat([newHistory, currentHistory], newHistory.length + currentHistory.length);
        yield fs.writeFile(HISTORY_FILE, concat);
    } else { // File does not exist. Generate full history.
        changelogOptions.releaseCount = 0;
        const history = yield createChangelog(changelogOptions);
        yield fs.writeFile(HISTORY_FILE, history);
    }
}

function createChangelog(options) {
    return new Promise((resolve, reject) => {
        const changelogStream = changelog(options);
        const concatStream = concat(resolve);
        changelogStream.on('error', reject);
        changelogStream.pipe(concatStream);
    });
}
