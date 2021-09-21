'use strict';

const { writeFileSync } = require('fs');
const fetch = require('cross-fetch');
const debug = require('debug')('getFile');

async function getFile(file, targetFile) {
  try {
    const response = await fetch(file.url);
    const arrayBuffer = await response.arrayBuffer();
    writeFileSync(targetFile, new Uint8Array(arrayBuffer));
    debug('Downloading: ' + file.name);
  } catch (e) {
    debug('ERROR downloading: ' + file.url);
    throw e;
  }
}

module.exports = getFile;
