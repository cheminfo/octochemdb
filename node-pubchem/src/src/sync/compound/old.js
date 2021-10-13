'use strict';

const path = require('path');

const fs = require('fs-extra');
const debug = require('debug')('firstImport');

const pubChemConnection = new (require('../../util/PubChemConnection'))();

const syncFull = require('../http/syncFull');
const importOneFile = require('./importOneFile');

module.exports = async () => {
  return firstImport()
    .catch((e) => {
      debug(`error: ${e.toString()}`);
      console.error(e);
    })
    .then(() => {
      debug('closing DB');
      pubChemConnection.close();
    });
};

async function firstImport() {
  const adminCollection = await pubChemConnection.getAdminCollection();
  const collection = await pubChemConnection.getMoleculesCollection();

  let progress = await adminCollection.find({ _id: 'main_progress' }).next();
  if (progress === null) {
    debug('Starting new database construction.');
    progress = {
      _id: 'main_progress',
      state: 'import',
      seq: 0,
      date: new Date(),
    };
    await adminCollection.insertOne(progress);
  } else {
    if (progress.state === 'update') {
      debug('First importation has been completed. Should only update.');
      return;
    } else {
      debug(`Continuing first importation from ${progress.seq}.`);
    }
  }

  await syncFull({ limit: process.env.TEST === 'true' ? 10 : 0 });

  const lastDocument = await collection
    .find({ seq: { $lte: progress.seq } })
    .sort('_id', -1)
    .limit(1)
    .next();
  let firstID = lastDocument ? lastDocument._id : 0;

  const dataDir = `${__dirname}/../../${config.dataFullDir}`;

  const dataFiles = await fs.readdir(dataDir);
  const firstName = getNextFilename(firstID);
  debug(`firstName: ${firstName}`);
  const firstIndex = dataFiles.findIndex((n) => n === firstName);

  if (firstIndex === -1) {
    throw new Error(`file not found: ${firstName}`);
  }

  debug(`starting with file ${firstName}`);
  for (let i = firstIndex; i < dataFiles.length; i++) {
    if (!dataFiles[i].endsWith('.sdf.gz')) continue;

    let start = Date.now();
    debug(`processing file ${dataFiles[i]}`);
    let newMolecules = await importOneFile(
      path.join(dataDir, dataFiles[i]),
      pubChemConnection,
      { firstID, progress },
    );
    debug(
      `Added ${newMolecules} new molecules at a speed of ${Math.floor(
        (newMolecules / (Date.now() - start)) * 1000,
      )} compounds per second`,
    );
  }

  progress.state = 'update';

  await adminCollection.updateOne({ _id: progress._id }, { $set: progress });

  await collection.createIndex({ em: 1 });
  await collection.createIndex({ mf: 1 });
  await collection.createIndex({ nbFragments: 1 });
  await collection.createIndex({ charge: 1 });
  await collection.createIndex({ noStereoID: 1 });
  await collection.createIndex({ 'ocl.id': 1 });
}

const elementsPerRange = 500000;
function getNextFilename(id) {
  const factor = Math.floor(id / elementsPerRange);
  const start = elementsPerRange * factor + 1;
  const end = elementsPerRange * (factor + 1);
  return `Compound_${addZeros(start)}_${addZeros(end)}.sdf.gz`;
}

function addZeros(value) {
  let str = String(value);
  return '0'.repeat(9 - str.length) + str;
}
