'use strict';

const syncFolder = require('./utils/syncFolder');

const debug = require('debug')('syncFull');

const SOURCE = 'https://ftp.ncbi.nlm.nih.gov/pubchem/';

const foldersToSync = [
  {
    source: `${SOURCE}Compound/CURRENT-Full/SDF`,
    destination: `${process.env.ORIGINAL_DATA_PATH}/compound/full`,
  },
  {
    source: `${SOURCE}Substance/CURRENT-Full/SDF`,
    destination: `${process.env.ORIGINAL_DATA_PAT}/substance/full`,
  },
];

async function syncFull(options) {
  for (const folder of foldersToSync) {
    debug(`Syncing: ${folder.source} to ${folder.destination}`);
    await syncFolder(folder.source, folder.destination, {
      filterName: (file) => file && file.name.endsWith('.gz'),
      ...options,
    });
  }
}

module.exports = syncFull;
