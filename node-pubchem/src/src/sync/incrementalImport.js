'use strict';

process.on('unhandledRejection', (e) => {
  throw e;
});

const path = require('path');

const fs = require('fs-extra');

const pubChemConnection = new (require('../util/PubChemConnection'))();

const debug = require('debug')('update');

const syncUpdates = require('./http/syncUpdates');
const importOneFile = require('./importOneFile');

const dataDir = `${__dirname}/../../${config.dataWeeklyDir}`;

module.exports = async function () {
  return incrementalImport()
    .catch((e) => {
      console.error(e);
    })
    .then(() => {
      debug('closingDB');
      if (pubChemConnection) pubChemConnection.close();
    });
};

async function incrementalImport() {
  await syncUpdates(
    config.sourceServer,
    'pubchem/Compound/Weekly',
    config.dataWeeklyDir,
  );

  const adminCollection = await pubChemConnection.getAdminCollection();
  const collection = await pubChemConnection.getCollection('compounds');

  let progress = await adminCollection.find({ _id: 'main_progress' }).next();
  if (!progress || progress.state !== 'update') {
    throw new Error('run import first');
  }

  let lastFile = progress.file || '';
  const lastDate = progress.date;
  const weeklyDirs = await fs.readdir(dataDir);

  for (const week of weeklyDirs) {
    const weekDate = new Date(week);
    if (weekDate <= lastDate) continue;
    debug(`processing directory ${week}`);
    const weekDir = path.join(dataDir, week);

    debug('weekEdir', weekDir);
    // remove killed compounds
    if (!lastFile) {
      let killed;
      try {
        const killedFile = await fs.readFile(
          path.join(weekDir, 'killed-CIDs'),
          'ascii',
        );
        killed = killedFile.split(/\r?\n/).map(Number);
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }
      if (killed) {
        debug(`removing ${killed.length} killed IDs`);
        for (const killedID of killed) {
          await collection.deleteOne({ _id: killedID });
        }
        debug('removing done');
      }
    }

    // insert new or updated compounds
    const sdfList = await fs.readdir(weekDir);
    for (const sdfFile of sdfList) {
      if (!sdfFile.endsWith('.sdf.gz')) continue;
      if (lastFile && lastFile >= sdfFile) continue;
      const sdfPath = path.join(weekDir, sdfFile);

      debug(`processing file ${sdfFile}`);
      let newMolecules = await importOneFile(sdfPath, pubChemConnection, {
        progress,
      });
      debug(`Added ${newMolecules} new molecules`);
    }

    progress.date = weekDate;
    lastFile = progress.file = '';
    await adminCollection.updateOne({ _id: progress._id }, { $set: progress });
  }
}
