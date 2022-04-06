import { readFileSync } from 'fs';

import pkg from 'papaparse';

import Debug from '../../../utils/Debug.js';

import { parseCmaup } from './utils/parseCmaup.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
const { parse } = pkg;

const debug = Debug('syncCmaup');

export async function sync(connection) {
  let options = {
    collectionSource: process.env.CMAUP_SOURCE_INGREDIENTS,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/cmaup/full`,
    collectionName: 'cmaup',
    filenameNew: 'Ingredients',
    extensionNew: 'txt',
  };
  const lastFile = await getLastFileSync(options);
  options.collectionSource = process.env.CMAUP_SOURCE_ACTIVITY;
  options.filenameNew = 'activity';
  const lastFileActivity = await getLastFileSync(options);
  options.collectionSource = process.env.CMAUP_SOURCE_SPECIESASSOCIATION;
  options.filenameNew = 'speciesAssociation';
  const lastFileSpeciesAssociation = await getLastFileSync(options);
  options.collectionSource = process.env.CMAUP_SOURCE_SPECIESINFO;
  options.filenameNew = 'speciesInfo';
  const lastFileSpeciesInfo = await getLastFileSync(options);
  const progress = await connection.getProgress('cmaup');
  const collection = await connection.getCollection('cmaup');
  await collection.createIndex({ 'data.ocl.id': 1 });
  await collection.createIndex({ 'data.ocl.noStereoID': 1 });
  const lastDocumentImported = await getLastCMAUPImported(connection, progress);

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
  if (
    lastDocumentImported === null ||
    (!lastFile.includes(lastDocumentImported._source) &&
      progress.state === 'updated') ||
    progress.state !== 'updated'
  ) {
    for (const entry of parseCmaup(
      general,
      activities,
      speciesPair,
      speciesInfo,
    )) {
      counter++;
      if (process.env.TEST === 'true' && counter > 20) break;
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
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
      progress.state = 'updating';
      await connection.setProgress(progress);
      imported++;
    }
    progress.state = 'updated';
    await connection.setProgress(progress);
    debug(`${imported} compounds processed`);
  } else {
    debug(`file already processed`);
  }
  // we remove all the entries that are not imported by the last file
  const result = await collection.deleteMany({
    _source: { $ne: source },
  });
  debug(`Deleting entries with wrong source: ${result.deletedCount}`);
}

async function getLastCMAUPImported(connection, progress) {
  const collection = await connection.getCollection('cmaup');
  return collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();
}
