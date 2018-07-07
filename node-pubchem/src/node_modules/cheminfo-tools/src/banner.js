'use strict';

function getMainBanner(pkg) {
    let result = `/**
 * ${pkg.name}`;
    if (pkg.description) result += ` - ${pkg.description}`;
    result += `
 * @version v${pkg.version}
`;
    if (pkg.homepage) result += ` * @link ${pkg.homepage}
`;
    if (pkg.license) result += ` * @license ${pkg.license}
`;
    return result + ' */';
}

function getMinBanner(pkg) {
    let result = `/** ${pkg.name}@${pkg.version}`;
    if (pkg.license) result += `, ${pkg.license} licensed`;
    if (pkg.homepage) result += `. ${pkg.homepage}`;
    return result + ' */';
}

module.exports = {
    getMainBanner,
    getMinBanner
};
