import getLastFileSync from '../../../../sync/http/utils/getLastFileSync.js';
import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import pkg from 'papaparse';
import { readFileSync } from 'fs';

const { parse } = pkg;

async function cmaupStartSyning(connection) {
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
  const source = [
    lastFile.replace(process.env.ORIGINAL_DATA_PATH, ''),
    lastFileActivity.replace(process.env.ORIGINAL_DATA_PATH, ''),
    lastFileSpeciesAssociation.replace(process.env.ORIGINAL_DATA_PATH, ''),
    lastFileSpeciesInfo.replace(process.env.ORIGINAL_DATA_PATH, ''),
  ];
  const newFiles = [
    lastFile,
    lastFileActivity,
    lastFileSpeciesAssociation,
    lastFileSpeciesInfo,
  ];
  const progress = await connection.getProgress('cmaup');
  const collection = await connection.getCollection('cmaup');
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
  return {
    firstID,
    lastDocumentImported,
    progress,
    source,
    collection,
    general,
    activities,
    speciesPair,
    speciesInfo,
    newFiles,
  };
}
export default cmaupStartSyning;
