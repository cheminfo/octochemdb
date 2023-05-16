import md5 from 'md5';

import getLastFileSync from '../../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('getCmaupsLastFiles');
/**
 * @description get necessary variables to start the sync
 * @param {*} connection the connection to the database
 * @returns {Promise<*>} lastFile, lastFileActivity, lastFileSpeciesAssociation, lastFileSpeciesInfo, sources, progress, logs
 */
export default async function getCmaupsLastFiles(connection) {
  try {
    let source;
    let lastFileGeneral;
    let lastFileActivity;
    let lastFileSpeciesAssociation;
    let lastFileSpeciesInfo;
    let sources;

    if (process.env.NODE_ENV === 'test') {
      lastFileGeneral = `${process.env.CMAUPS_FILE_GENERAL_TEST}`;
      lastFileActivity = `${process.env.CMAUPS_FILE_ACTIVITY_TEST}`;
      lastFileSpeciesAssociation = `${process.env.CMAUPS_FILE_SPECIESASSOCIATION_TEST}`;
      lastFileSpeciesInfo = `${process.env.CMAUPS_FILE_SPECIESINFO_TEST}`;
      source = [
        lastFileGeneral,
        lastFileActivity,
        lastFileSpeciesAssociation,
        lastFileSpeciesInfo,
      ];
      sources = md5(JSON.stringify([source]));
    } else {
      let options = {
        collectionSource: process.env.CMAUP_SOURCE_INGREDIENTS,
        destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/cmaups/full`,
        collectionName: 'cmaups',
        filenameNew: 'Ingredients',
        extensionNew: 'txt',
      };
      // Get file Ingredients who contain general data about the molecule
      lastFileGeneral = await getLastFileSync(options);
      // Get file containing activity data for all active ingredients (lastFileGeneral)
      options.collectionSource = process.env.CMAUP_SOURCE_ACTIVITY;
      options.filenameNew = 'activity';
      lastFileActivity = await getLastFileSync(options);
      // Get file Species association allows to relate mocule ID with taxonomies IDs
      options.collectionSource = process.env.CMAUP_SOURCE_SPECIESASSOCIATION;
      options.filenameNew = 'speciesAssociation';
      lastFileSpeciesAssociation = await getLastFileSync(options);
      // Get file with taxonomies informations
      options.collectionSource = process.env.CMAUP_SOURCE_SPECIESINFO;
      options.filenameNew = 'speciesInfo';
      lastFileSpeciesInfo = await getLastFileSync(options);

      // Get collection importationLogs
      source = [
        lastFileGeneral.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
        lastFileActivity.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
        lastFileSpeciesAssociation.replace(
          `${process.env.ORIGINAL_DATA_PATH}`,
          '',
        ),
        lastFileSpeciesInfo.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
      ];
      // Get sources with new downloaded files (will be used to check if necessary to update collection)
      sources = md5(
        JSON.stringify([
          lastFileGeneral.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
          lastFileActivity.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
          lastFileSpeciesAssociation.replace(
            `${process.env.ORIGINAL_DATA_PATH}`,
            '',
          ),
          lastFileSpeciesInfo.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
        ]),
      );
    }
    // Get collection admin
    const progress = await connection.getProgress('cmaups');
    const logs = await connection.getImportationLog({
      collectionName: 'cmaups',
      sources: source,
      startSequenceID: progress.seq,
    });

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
      await debug.fatal(e.message, {
        collection: 'cmaups',
        connection,
        stack: e.stack,
      });
    }
  }
}
