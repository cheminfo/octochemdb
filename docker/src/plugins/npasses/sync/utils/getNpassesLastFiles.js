import md5 from 'md5';

import getLastFileSync from '../../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../../utils/Debug.js';

/**
 * @description get last npass files available in the NPASS database
 * @param {*} connection - mongo connection
 * @returns {Promise<Object>} returns the variables {lastFile, lastFileActivity, lastFileSpeciesProperties, lastFileSpeciesInfo, lastFileSpeciesPair, sources, progress, logs}
 */
export default async function getNpassesLastFiles(connection) {
  const debug = debugLibrary('getNpassesLastFiles');
  try {
    let source;
    let lastFile;
    let lastFileActivity;
    let lastFileSpeciesProperties;
    let lastFileSpeciesInfo;
    let lastFileSpeciesPair;
    let sources;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `${process.env.NPASS_FILE_GENERAL_TEST}`;
      lastFileActivity = `${process.env.NPASS_FILE_ACTIVITY_TEST}`;
      lastFileSpeciesProperties = `${process.env.NPASS_FILE_PROPERTIES_TEST}`;
      lastFileSpeciesInfo = `${process.env.NPASS_FILE_SPECIESINFO_TEST}`;
      lastFileSpeciesPair = `${process.env.NPASS_FILE_SPECIESPAIR_TEST}`;
      source = [
        lastFile,
        lastFileActivity,
        lastFileSpeciesProperties,
        lastFileSpeciesInfo,
        lastFileSpeciesPair,
      ];
      sources = md5(JSON.stringify([source]));
    } else {
      let options = {
        collectionSource: process.env.NPASS_SOURCE_GENERALINFO,
        destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/npasses/full`,
        collectionName: 'npasses',
        filenameNew: 'general',
        extensionNew: 'txt',
      };
      // get last files available in the NPASS database
      lastFile = await getLastFileSync(options);
      options.collectionSource = process.env.NPASS_SOURCE_ACTIVITY;
      options.filenameNew = 'activities';
      lastFileActivity = await getLastFileSync(options);
      options.collectionSource = process.env.NPASS_SOURCE_PROPERTIES;
      options.filenameNew = 'properties';
      lastFileSpeciesProperties = await getLastFileSync(options);
      options.collectionSource = process.env.NPASS_SOURCE_SPECIESPAIR;
      options.filenameNew = 'speciesPair';
      lastFileSpeciesPair = await getLastFileSync(options);
      options.collectionSource = process.env.NPASS_SOURCE_SPECIESINFO;
      options.filenameNew = 'speciesInfo';
      lastFileSpeciesInfo = await getLastFileSync(options);
      // define sources
      source = [
        lastFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
        lastFileActivity.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
        lastFileSpeciesProperties.replace(
          `${process.env.ORIGINAL_DATA_PATH}`,
          '',
        ),
        lastFileSpeciesInfo.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
        lastFileSpeciesPair.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
      ];
      sources = md5(
        JSON.stringify([
          lastFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
          lastFileActivity.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
          lastFileSpeciesProperties.replace(
            `${process.env.ORIGINAL_DATA_PATH}`,
            '',
          ),
          lastFileSpeciesInfo.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
          lastFileSpeciesPair.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
        ]),
      );
    }
    // set logs
    const progress = await connection.getProgress('npasses');
    const logs = await connection.getImportationLog({
      collectionName: 'npasses',
      sources: source,
      startSequenceID: progress.seq,
    });

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
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'npasses', connection, stack: e.stack });
    }
  }
}
