'use strict';

const { join } = require('path');

const { mkdirpSync, existsSync, statSync } = require('fs-extra');

const getFile = require('./getFile');
const getFilesList = require('./getFilesList');

const debug = require('debug')('syncFolder');

async function syncFolder(source, destinationFolder, options = {}) {
  if (!existsSync(destinationFolder)) {
    mkdirpSync(destinationFolder);
  }

  const limit = process.env.TEST === 'true' ? 10 : undefined;

  let allFiles = await getFilesList(source, options);
  if (limit) allFiles = allFiles.slice(0, limit);
  const newFiles = [];
  for (const file of allFiles) {
    const targetFile = join(destinationFolder, file.name);
    file.path = targetFile;
    if (existsSync(targetFile)) {
      const fileInfo = statSync(targetFile);
      debug(`Skipping: ${file.name} Size: ${file.size}/${fileInfo.size}`);
      continue;
    }
    await getFile(file, targetFile);
    newFiles.push(file);
  }
  return { allFiles, newFiles };
}

module.exports = syncFolder;
