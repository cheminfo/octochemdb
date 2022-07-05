import md5 from 'md5';

import getLastFileSync from '../../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('getCmaupsLastFiles');
/**
 * @description get necessary variables to start the sync
 * @param {*} connection the connection to the database
 * @returns {Promise<*>} lastFile, lastFileActivity, lastFileSpeciesAssociation, lastFileSpeciesInfo, sources, progress, logs
 */
export default async function getCmaupsLastFiles(connection) {
  try {
    let options = {
      collectionSource: process.env.CMAUP_SOURCE_INGREDIENTS,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/cmaups/full`,
      collectionName: 'cmaups',
      filenameNew: 'Ingredients',
      extensionNew: 'txt',
    };
    // Get file Ingredients who contain general data about the molecule
    const lastFileGeneral = await getLastFileSync(options);
    // Get file containing activity data for all active ingredients (lastFileGeneral)
    options.collectionSource = process.env.CMAUP_SOURCE_ACTIVITY;
    options.filenameNew = 'activity';
    const lastFileActivity = await getLastFileSync(options);
    // Get file Species association allows to relate mocule ID with taxonomies IDs
    options.collectionSource = process.env.CMAUP_SOURCE_SPECIESASSOCIATION;
    options.filenameNew = 'speciesAssociation';
    const lastFileSpeciesAssociation = await getLastFileSync(options);
    // Get file with taxonomies informations
    options.collectionSource = process.env.CMAUP_SOURCE_SPECIESINFO;
    options.filenameNew = 'speciesInfo';
    const lastFileSpeciesInfo = await getLastFileSync(options);
    // Get collection admin
    const progress = await connection.getProgress('cmaups');
    // Get collection importationLogs
    let source = [
      lastFileGeneral.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileActivity.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileSpeciesAssociation.replace(process.env.ORIGINAL_DATA_PATH, ''),
      lastFileSpeciesInfo.replace(process.env.ORIGINAL_DATA_PATH, ''),
    ];
    const logs = await connection.getImportationLog({
      collectionName: 'cmaups',
      sources: source,
      startSequenceID: progress.seq,
    });
    // Get sources with new downloaded files (will be used to check if necessary to update collection)
    const sources = md5(
      JSON.stringify([
        lastFileGeneral.replace(process.env.ORIGINAL_DATA_PATH, ''),
        lastFileActivity.replace(process.env.ORIGINAL_DATA_PATH, ''),
        lastFileSpeciesAssociation.replace(process.env.ORIGINAL_DATA_PATH, ''),
        lastFileSpeciesInfo.replace(process.env.ORIGINAL_DATA_PATH, ''),
      ]),
    );
    // return [lastFileGeneral, lastFileActivity, lastFileSpeciesAssociation, lastFileSpeciesInfo, sources, progress, logs];
    return [
      lastFileGeneral,
      lastFileActivity,
      lastFileSpeciesAssociation,
      lastFileSpeciesInfo,
      sources,
      progress,
      logs,
    ];
  } catch (e) {
    // If error is chatched, debug it on telegram
    if (connection) {
      debug(e.message, { collection: 'bioassays', connection, stack: e.stack });
    }
  }
}
