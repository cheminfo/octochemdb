'use strict';

const fs = require('fs-extra');

const config = require('../../util/config');

const getFile = require('./getFile');
const getList = require('./getList');
const syncFolder = require('./syncFolder');

module.exports = async function syncUpdates(
  ftpHost,
  ftpDirectory,
  destinationFolder,
) {
  const weeklyFolders = await getList(
    config.ftpServer,
    'pubchem/Compound/Weekly',
  );

  for (let weeklyFolder of weeklyFolders) {
    let destinationFolder = `${__dirname}/../../../${config.dataWeeklyDir}/${weeklyFolder}`;
    console.log(`Syncing folder ${weeklyFolder} to ${destinationFolder}`);
    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirpSync(destinationFolder);
    }
    await syncFolder(
      config.ftpServer,
      `${ftpDirectory}/${weeklyFolder}/SDF`,
      destinationFolder,
    );

    getFile(
      config.ftpServer,
      `${ftpDirectory}/${weeklyFolder}/`,
      destinationFolder,
      'killed-CIDs',
    );
  }
};
