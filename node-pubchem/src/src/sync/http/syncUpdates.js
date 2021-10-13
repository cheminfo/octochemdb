'use strict';

const getFile = require('./utils/getFile');
const getFilesList = require('./utils/getFilesList');
const syncFolder = require('./utils/syncFolder');

const debug = require('debug')('syncUpdates');

const SOURCE = 'https://ftp.ncbi.nlm.nih.gov/pubchem/';

async function syncUpdates() {
  // we sync all the weeks
  const weeks = await getFilesList(`${SOURCE}Substance/Weekly`, {
    fileFilter: (file) => file && file.name.match(/\d{4}-\d{2}-\d{2}/),
  });
  for (let week of weeks) {
    const baseSource = `${SOURCE}/Substance/Weekly/${week.name}`;
    debug(`Processing week: ${week.name}`);
    await syncFolder(
      `${baseSource}SDF/`,
      `./originalData/substances/weekly/${week.name}SDF/`,
      {
        fileFilter: (file) => file && file.name.endsWith('.gz'),
      },
    );
    await getFile(
      { url: `${baseSource}killed-CIDs`, name: 'killed-CIDs' },
      `./originalData/substances/weekly/${week.name}killed-CIDs`,
    );
  }
  return;
}

module.exports = syncUpdates;
