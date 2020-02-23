'use strict';

const path = require('path');

const fs = require('fs-extra');

const config = require('../util/config');
const pubChemConnection = new (require('../util/PubChemConnection'))();

const importOneFile = require('./importOneFile');
const syncFolder = require('./ftp/syncFolder');

module.exports = async function() {
  return firstImport()
    .catch(function(e) {
      console.log('error');
      console.error(e);
    })
    .then(function() {
      console.log('closing DB');
      pubChemConnection.close();
    });
};

async function firstImport() {
  const adminCollection = await pubChemConnection.getAdminCollection();
  const collection = await pubChemConnection.getMoleculesCollection();

  let progress = await adminCollection.find({ _id: 'main_progress' }).next();
  if (progress === null) {
    console.log('Starting new database construction.');
    progress = {
      _id: 'main_progress',
      state: 'import',
      seq: 0,
      date: new Date(),
    };
    await adminCollection.insertOne(progress);
  } else {
    if (progress.state === 'update') {
      console.log('First importation has been completed. Should only update.');
      return;
    } else {
      console.log(`Continuing first importation from ${progress.seq}.`);
    }
  }

  const dataDir = `${__dirname}/../../${config.dataFullDir}`;

  await syncFolder(
    config.ftpServer,
    'pubchem/Compound/CURRENT-Full/SDF',
    dataDir,
  );

  const lastDocument = await collection
    .find({ seq: { $lte: progress.seq } })
    .sort('_id', -1)
    .limit(1)
    .next();
  let firstID = lastDocument ? lastDocument._id : 0;

  const dataFiles = await fs.readdir(dataDir);
  const firstName = getNextFilename(firstID);
  console.log({ firstName });
  const firstIndex = dataFiles.findIndex((n) => n === firstName);

  if (firstIndex === -1) {
    throw new Error(`file not found: ${firstName}`);
  }

  console.log(`starting with file ${firstName}`);
  for (let i = firstIndex; i < dataFiles.length; i++) {
    if (!dataFiles[i].endsWith('.sdf.gz')) continue;

    let start = Date.now();
    console.log(`processing file ${dataFiles[i]}`);
    let newMolecules = await importOneFile(
      path.join(dataDir, dataFiles[i]),
      pubChemConnection,
      { firstID, progress },
    );
    console.log(
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
}

const elementsPerRange = 25000;
function getNextFilename(id) {
  const factor = Math.floor(id / elementsPerRange);
  const start = 25000 * factor + 1;
  const end = 25000 * (factor + 1);
  return `Compound_${addZeros(start)}_${addZeros(end)}.sdf.gz`;
}

function addZeros(value) {
  let str = String(value);
  return '0'.repeat(9 - str.length) + str;
}
