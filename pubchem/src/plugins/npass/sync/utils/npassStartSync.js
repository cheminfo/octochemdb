import getLastFileSync from '../../../../sync/http/utils/getLastFileSync.js';
import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import pkg from 'papaparse';
import { readFileSync } from 'fs';

const { parse } = pkg;

async function npassStartSync(connection) {
  let options = {
    collectionSource: process.env.NPASS_SOURCE_GENERALINFO,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/npass/full`,
    collectionName: 'npass',
    filenameNew: 'general',
    extensionNew: 'txt',
  };
  const lastFile = await getLastFileSync(options);
  options.collectionSource = process.env.NPASS_SOURCE_ACTIVITY;
  options.filenameNew = 'activities';
  const lastFileActivity = await getLastFileSync(options);
  options.collectionSource = process.env.NPASS_SOURCE_PROPERTIES;
  options.filenameNew = 'properties';
  const lastFileSpeciesProperties = await getLastFileSync(options);
  options.collectionSource = process.env.NPASS_SOURCE_SPECIESPAIR;
  options.filenameNew = 'speciesPair';
  const lastFileSpeciesPair = await getLastFileSync(options);
  options.collectionSource = process.env.NPASS_SOURCE_SPECIESINFO;
  options.filenameNew = 'speciesInfo';
  const lastFileSpeciesInfo = await getLastFileSync(options);
  const source = [
    lastFile.replace(process.env.ORIGINAL_DATA_PATH, ''),
    lastFileActivity.replace(process.env.ORIGINAL_DATA_PATH, ''),
    lastFileSpeciesProperties.replace(process.env.ORIGINAL_DATA_PATH, ''),
    lastFileSpeciesInfo.replace(process.env.ORIGINAL_DATA_PATH, ''),
    lastFileSpeciesPair.replace(process.env.ORIGINAL_DATA_PATH, ''),
  ];
  const newFiles = [
    lastFile,
    lastFileActivity,
    lastFileSpeciesProperties,
    lastFileSpeciesInfo,
    lastFileSpeciesPair,
  ];
  const progress = await connection.getProgress('npass');
  const collection = await connection.getCollection('npass');
  await collection.createIndex({ 'data.ocl.id': 1 });
  await collection.createIndex({ 'data.ocl.noStereoID': 1 });
  const lastDocumentImported = await getLastDocumentImported(
    connection,
    progress,
    options.collectionName,
  );

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

  return {
    firstID,
    lastDocumentImported,
    progress,
    source,
    collection,
    general,
    activities,
    properties,
    speciesPair,
    speciesInfo,
    newFiles,
  };
}
export default npassStartSync;
