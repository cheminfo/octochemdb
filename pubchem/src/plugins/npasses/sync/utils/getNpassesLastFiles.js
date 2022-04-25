import md5 from 'md5';
import getLastFileSync from '../../../../sync/http/utils/getLastFileSync.js';

async function getNpassesLastFiles(connection) {
  let options = {
    collectionSource: process.env.NPASS_SOURCE_GENERALINFO,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/npasses/full`,
    collectionName: 'npasses',
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

  const progress = await connection.getProgress('npasses');
  const logs = await connection.geImportationtLog({
    collectionName: 'npasses',
    sources: source,
    startSequenceID: progress.seq,
  });

  const sources = md5(
    JSON.stringify([
      lastFile.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileActivity.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileSpeciesProperties.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileSpeciesInfo.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileSpeciesPair.replace(process.env.ORIGINAL_DATA_PATH, ''),
    ]),
  );

  return {
    lastFile,
    lastFileActivity,
    lastFileSpeciesProperties,
    lastFileSpeciesInfo,
    lastFileSpeciesPair,
    sources,
    progress,
    logs,
  };
}
export default getNpassesLastFiles;
