import { readFileSync } from 'fs';

import Debug from 'debug';
import pkg from 'papaparse';

import getFileIfNew from '../../../sync/http/utils/getFileIfNew.js';

import { parseCMAUP } from './utils/parseCMAUP.js';

const { parse } = pkg;

const debug = Debug('syncCmaup');

export async function sync(connection) {
  const lastFile = await getLastCmaupFileIngredients();
  const lastFileActivity = await getLastCmaupFileActivity();
  const lastFileSpeciesAssociation = await getLastCmaupFileSpeciesAssociation();
  const lastFileSpeciesInfo = await getLastCmaupFileSpeciesInfo();
  const progress = await connection.getProgress('cmaup');
  const collection = await connection.getCollection('cmaup');

  const lastDocumentImported = await getLastTaxonomyImported(
    connection,
    progress,
  );
  debug(`lastDocumentImported: ${JSON.stringify(lastDocumentImported)}`);
  let firstID;
  if (
    lastDocumentImported &&
    lastDocumentImported._source &&
    lastFile.includes(lastDocumentImported._source)
  ) {
    firstID = lastDocumentImported._id;
  }
  const general = parse(readFileSync(lastFile, 'utf8'), {
    header: true,
  }).data;
  const activities = {};
  parse(readFileSync(lastFileActivity, 'utf8'), {
    header: true,
  }).data.forEach((entry) => {
    if (!activities[entry.Ingredient_ID]) {
      activities[entry.Ingredient_ID] = [];
    }
    activities[entry.Ingredient_ID].push(entry);
  });

  const speciesPair = parse(readFileSync(lastFileSpeciesAssociation, 'utf8'), {
    header: false,
  }).data;

  const speciesInfo = {};
  parse(readFileSync(lastFileSpeciesInfo, 'utf8'), {
    header: true,
  }).data.forEach((entry) => (speciesInfo[entry.Plant_ID] = entry));

  // we reparse all the file and skip if required
  const source = lastFile.replace(process.env.ORIGINAL_DATA_PATH, '');
  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();
  for (const entry of parseCMAUP(
    general,
    activities,
    speciesPair,
    speciesInfo,
  )) {
    counter++;
    if (process.env.TEST === 'true' && counter > 20) break;
    if (Date.now() - start > 10000) {
      debug(`Processing: counter: ${counter} - imported: ${imported}`);
      start = Date.now();
    }
    if (skipping) {
      if (firstID === entry._id) {
        skipping = false;
        debug(`Skipping compound till:${firstID}`);
      }
      continue;
    }
    entry._seq = ++progress.seq;
    entry._source = source;
    await collection.updateOne(
      { _id: entry._id },
      { $set: entry },
      { upsert: true },
    );
    await connection.setProgress(progress);
    imported++;
  }
  debug(`${imported} compounds processed`);

  // we remove all the entries that are not imported by the last file
  const result = await collection.deleteMany({
    _source: { $ne: source },
  });
  debug(`Deleting entries with wrong source: ${result.deletedCount}`);
}

async function getLastTaxonomyImported(connection, progress) {
  const collection = await connection.getCollection('cmaup');
  return collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();
}

async function getLastCmaupFileIngredients() {
  debug('Get last cmaup Ingredients file if new');

  const sourceIngredients = process.env.CMAUP_SOURCE_INGREDIENTS;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/cmaup/full`;

  debug(`Syncing: ${sourceIngredients} to ${destination}`);

  return getFileIfNew({ url: sourceIngredients }, destination);
}

async function getLastCmaupFileActivity() {
  debug('Get last cmaup Ingredients file if new');

  const sourceActivity = process.env.CMAUP_SOURCE_ACTIVITY;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/cmaup/full`;

  debug(`Syncing: ${sourceActivity} to ${destination}`);

  return getFileIfNew({ url: sourceActivity }, destination);
}

async function getLastCmaupFileSpeciesAssociation() {
  debug('Get last cmaup Ingredients file if new');

  const sourceSpeciesAssociation = process.env.CMAUP_SOURCE_SPECIESASSOCIATION;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/cmaup/full`;

  debug(`Syncing: ${sourceSpeciesAssociation} to ${destination}`);

  return getFileIfNew({ url: sourceSpeciesAssociation }, destination);
}

async function getLastCmaupFileSpeciesInfo() {
  debug('Get last cmaup Ingredients file if new');

  const sourceSpeciesInfo = process.env.CMAUP_SOURCE_SPECIESINFO;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/cmaup/full`;

  debug(`Syncing: ${sourceSpeciesInfo} to ${destination}`);

  return getFileIfNew({ url: sourceSpeciesInfo }, destination);
}