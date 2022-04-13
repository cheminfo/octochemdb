import md5 from 'md5';
import getLastFileSync from '../../../../sync/http/utils/getLastFileSync';

async function getCmaupLastFiles() {
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
  const sources = md5(
    JSON.stringify([
      lastFile.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileActivity.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileSpeciesAssociation.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileSpeciesInfo.replace(process.env.ORIGINAL_DATA_PATH, ''),
    ]),
  );
  const newFiles = md5(
    JSON.stringify([
      lastFile,
      lastFileActivity,
      lastFileSpeciesAssociation,
      lastFileSpeciesInfo,
    ]),
  );
  return {
    lastFile,
    lastFileActivity,
    lastFileSpeciesAssociation,
    lastFileSpeciesInfo,
    sources,
    newFiles,
  };
}
export default getCmaupLastFiles;
