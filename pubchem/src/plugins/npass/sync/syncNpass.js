import { readFileSync } from 'fs';

import debug from '../../../utils/debug.js';
import pkg from 'papaparse';

import getFileIfNew from '../../../sync/http/utils/getFileIfNew.js';

import { parseNpass } from './utils/parseNpass.js';

const { parse } = pkg;

debug('syncNpass');

export async function sync(connection) {
  const lastFile = await getLastNpassFileGeneralInfo();
  const lastFileActivity = await getLastNpassFileActivity();
  const lastFileSpeciesProperties = await getLastNpassFileProperties();
  const lastFileSpeciesPair = await getLastNpassFileSpeciesPair();
  const lastFileSpeciesInfo = await getLastNpassFileSpeciesInfo();
  const progress = await connection.getProgress('npass');
  const collection = await connection.getCollection('npass');
  await collection.createIndex({ 'data.ocl.id': 1 });
  await collection.createIndex({ 'data.ocl.noStereoID': 1 });
  const lastDocumentImported = await getLastNpassImported(connection, progress);
  await debug(`lastDocumentImported: ${JSON.stringify(lastDocumentImported)}`);
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
    if (!activities[entry.np_id]) {
      activities[entry.np_id] = [];
    }
    activities[entry.np_id].push(entry);
  });
  const properties = {};
  parse(readFileSync(lastFileSpeciesProperties, 'utf8'), {
    header: true,
  }).data.forEach((entry) => (properties[entry.np_id] = entry));
  const speciesPair = {};
  parse(readFileSync(lastFileSpeciesPair, 'utf8'), {
    header: true,
  }).data.forEach((entry) => (speciesPair[entry.np_id] = entry.org_id));
  const speciesInfo = {};
  parse(readFileSync(lastFileSpeciesInfo, 'utf8'), {
    header: true,
  }).data.forEach((entry) => (speciesInfo[entry.org_id] = entry));

  // we reparse all the file and skip if required
  const source = lastFile.replace(process.env.ORIGINAL_DATA_PATH, '');
  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();

  if (
    lastDocumentImported === null ||
    (progress.seq !== lastDocumentImported._seq &&
      general !== lastDocumentImported._source &&
      progress.state !== 'imported')
  ) {
    await debug(`Start parsing`);
    for (const entry of parseNpass(
      general,
      activities,
      properties,
      speciesPair,
      speciesInfo,
    )) {
      counter++;
      if (process.env.TEST === 'true' && counter > 20) break;
      if (Date.now() - start > 10000) {
        await debug(`Processing: counter: ${counter} - imported: ${imported}`);
        start = Date.now();
      }
      if (skipping) {
        if (firstID === entry._id) {
          skipping = false;
          await debug(`Skipping compound till:${firstID}`);
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
    progress.state = 'imported';
    await connection.setProgress(progress);
    await debug(`${imported} compounds processed`);
  } else {
    await debug(`file already processed`);
  }
  // we remove all the entries that are not imported by the last file
  const result = await collection.deleteMany({
    _source: { $ne: source },
  });
  await debug(`Deleting entries with wrong source: ${result.deletedCount}`);
}

async function getLastNpassImported(connection, progress) {
  const collection = await connection.getCollection('npass');
  return collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();
}

async function getLastNpassFileGeneralInfo() {
  await debug('Get last cmaup GeneralInfo file if new');

  const sourceGeneralInfo = process.env.NPASS_SOURCE_GENERALINFO;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/npass/full`;

  await debug(`Syncing: ${sourceGeneralInfo} to ${destination}`);

  return getFileIfNew({ url: sourceGeneralInfo }, destination, {
    filename: 'general',
    extension: 'txt',
  });
}

async function getLastNpassFileActivity() {
  await debug('Get last npass Activity file if new');

  const sourceActivity = process.env.NPASS_SOURCE_ACTIVITY;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/npass/full`;

  await debug(`Syncing: ${sourceActivity} to ${destination}`);

  return getFileIfNew({ url: sourceActivity }, destination, {
    filename: 'activities',
    extension: 'txt',
  });
}

async function getLastNpassFileProperties() {
  await debug('Get last cmaup Properties file if new');

  const sourceProperties = process.env.NPASS_SOURCE_PROPERTIES;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/npass/full`;

  await debug(`Syncing: ${sourceProperties} to ${destination}`);

  return getFileIfNew({ url: sourceProperties }, destination, {
    filename: 'properties',
    extension: 'txt',
  });
}

async function getLastNpassFileSpeciesPair() {
  await debug('Get last cmaup SpeciesPair file if new');

  const sourceSpeciesPair = process.env.NPASS_SOURCE_SPECIESPAIR;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/npass/full`;

  await debug(`Syncing: ${sourceSpeciesPair} to ${destination}`);

  return getFileIfNew({ url: sourceSpeciesPair }, destination, {
    filename: 'speciesPair',
    extension: 'txt',
  });
}

async function getLastNpassFileSpeciesInfo() {
  await debug('Get last cmaup SpeciesInfo file if new');

  const sourceSpeciesInfo = process.env.NPASS_SOURCE_SPECIESINFO;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/npass/full`;

  await debug(`Syncing: ${sourceSpeciesInfo} to ${destination}`);

  return getFileIfNew({ url: sourceSpeciesInfo }, destination, {
    filename: 'speciesInfo',
    extension: 'txt',
  });
}
