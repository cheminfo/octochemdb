'use strict';

const PubChemConnection = require('../../util/PubChemConnection');
const syncFolder = require('../http/utils/syncFolder');

const importOneFile = require('./importOneFile');

const debug = require('debug')('firstCompoundImport');

const COLLECTION = 'compound';

async function firstCompoundImport() {
  const allFiles = await getFullCompoundFolder();

  let connection;
  try {
    connection = new PubChemConnection();
    const progress = await connection.getProgress(COLLECTION);
    if (progress.state === 'update') {
      debug('First importation has been completed. Should only update.');
      return;
    } else {
      debug(`Continuing first importation from ${progress.seq}.`);
    }
    const files = await getFilesToImport(connection, progress, allFiles);

    await importCompoundFiles(connection, progress, files);
  } catch (e) {
    console.log(e);
  } finally {
    if (connection) await connection.close();
  }
}

async function importCompoundFiles(connection, progress, files) {
  for (let file of files) {
    await importOneFile(connection, progress, file);
  }
}

async function getFilesToImport(connection, progress, allFiles) {
  const collection = await connection.getCollection(COLLECTION);
  const lastDocument = await collection
    .find({ seq: { $lte: progress.seq } })
    .sort('_id', -1)
    .limit(1)
    .next();

  progress.lastProcessedID = lastDocument ? lastDocument._id : 0;

  if (!progress.lastProcessedID) return allFiles;

  const firstName = getNextFilename(progress.lastProcessedID);
  debug(`firstName: ${firstName}`);
  const firstIndex = allFiles.findIndex((n) => n === firstName);

  if (firstIndex === -1) {
    throw new Error(`file not found: ${firstName}`);
  }

  debug(`starting with file ${firstName}`);

  return allFiles.slice(firstIndex);
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

async function getFullCompoundFolder() {
  debug('Synchronize full compound folder');

  const source = `${process.env.PUBCHEM_SOURCE}Compound/CURRENT-Full/SDF`;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/compound/full`;

  debug(`Syncing: ${source} to ${destination}`);

  const { allFiles } = await syncFolder(source, destination, {
    fileFilter: (file) => file && file.name.endsWith('.gz'),
  });

  return allFiles;
}

module.exports = firstCompoundImport;
