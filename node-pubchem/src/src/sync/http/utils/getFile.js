'use strict';

const { writeFileSync } = require('fs');

const fetch = require('cross-fetch');
const debug = require('debug')('getFile');
const { utimes } = require('utimes');

async function getFile(file, targetFile) {
  try {
    const response = await fetch(file.url);
    const arrayBuffer = await response.arrayBuffer();

    writeFileSync(targetFile, new Uint8Array(arrayBuffer));
    utimes(targetFile, {
      btime: file.epoch,
      mtime: file.epoch,
      atime: file.epoch,
    });

    debug(`Downloading: ${file.name}`);
  } catch (e) {
    debug(`ERROR downloading: ${file.url}`);
    throw e;
  }
}

module.exports = getFile;
