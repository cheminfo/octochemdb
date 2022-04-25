import md5 from 'md5';
import getLastFileSync from '../../../../sync/http/utils/getLastFileSync.js';

async function getCmaupsLastFiles(connection) {
  let options = {
    collectionSource: process.env.CMAUP_SOURCE_INGREDIENTS,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/cmaups/full`,
    collectionName: 'cmaups',
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
  let source = [
    lastFile.replace(process.env.ORIGINAL_DATA_PATH, ''),
    lastFileActivity.replace(process.env.ORIGINAL_DATA_PATH, ''),
    lastFileSpeciesAssociation.replace(process.env.ORIGINAL_DATA_PATH, ''),
    lastFileSpeciesInfo.replace(process.env.ORIGINAL_DATA_PATH, ''),
  ];
  const progress = await connection.getProgress('cmaups');
  const logs = await connection.geImportationtLog({
    collectionName: 'cmaups',
    sources: source,
    startSequenceID: progress.seq,
  });

  const sources = md5(
    JSON.stringify([
      lastFile.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileActivity.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileSpeciesAssociation.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileSpeciesInfo.replace(process.env.ORIGINAL_DATA_PATH, ''),
    ]),
  );

  return {
    lastFile,
    lastFileActivity,
    lastFileSpeciesAssociation,
    lastFileSpeciesInfo,
    sources,
    progress,
    logs,
  };
}
export default getCmaupsLastFiles;
