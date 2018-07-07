'use strict';

const getLatestVersion = require('latest-version');
const semver = require('semver');
const githubParser = require('parse-github-repo-url');


const pack = require('../package.json');

exports.checkLatestVersion = function* (force) {
    if (force) return false;

    const latestVersion = yield getLatestVersion('cheminfo-tools');
    const thisVersion = pack.version;
    if (semver.gt(latestVersion, thisVersion)) {
        console.error(`Your version of cheminfo-tools (${thisVersion}) is obsolete. Latest is ${latestVersion}.
Please upgrade using the command: npm install -g cheminfo-tools`);
        return true;
    }

    return false;
};

exports.getOrgFromPackage = function (pkg) {
    try {
        let url;
        if (typeof pkg.repository === 'string') {
            url = pkg.repository;
            // return githubParser(pkg.repository)[0];
        } else if (pkg.repository && pkg.repository.url) {
            url = pkg.repository.url;
        } else if (pkg.bugs && pkg.bugs.url) {
            url = pkg.bugs.url;
        } else if (pkg.homepage) {
            url = pkg.homepage;
        }

        return githubParser(url)[0];
    } catch (e) {
        // ignore
    }

};
