'use strict';

const { mkdirpSync, existsSync, statSync } = require('fs-extra');
const getFilesList = require('./getFilesList');
const { join } = require('path');
const getFile = require('./getFile');
const debug = require('debug')('syncFolder');

async function syncFolder(source, destinationFolder, options = {}) {
  if (!existsSync(destinationFolder)) {
    mkdirpSync(destinationFolder);
  }

  const files = await getFilesList(source, options);
  const newFiles = [];
  for (const file of files) {
    const targetFile = join(destinationFolder, file.name);
    if (existsSync(targetFile)) {
      const fileInfo = statSync(targetFile);
      debug(
        'Skipping: ' + file.name + ' Size: ' + file.size + '/' + fileInfo.size,
      );
      continue;
    }
    await getFile(file, targetFile);
    newFiles.push(file);
  }
  return newFiles;
}

module.exports = syncFolder;

//  'https://ftp.ncbi.nlm.nih.gov/pubchem/Substance/CURRENT-Full/SDF/',
//  './originalData/full',

if (false) {
  syncFolder(
    'https://ftp.ncbi.nlm.nih.gov/pubchem/Substance/Monthly/2021-06-01/SDF/',
    './originalData/weekly',
    {
      filterName: (file) => file && file.name.endsWith('.gz'),
    },
  );
}
