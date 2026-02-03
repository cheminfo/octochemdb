import getLastFileSync from '../../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../../utils/Debug.js';

import { checkNpassesLink } from './checkNpassesLink.js';
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
    let lastTargetInfo;
    let sources;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `../docker/src/plugins/npasses/sync/utils/__tests__/data/generalTest.txt`;
      lastFileActivity = `../docker/src/plugins/npasses/sync/utils/__tests__/data/activitiesTest.txt`;
      lastFileSpeciesProperties = `../docker/src/plugins/npasses/sync/utils/__tests__/data/propertiesTest.txt`;
      lastFileSpeciesInfo = `../docker/src/plugins/npasses/sync/utils/__tests__/data/speciesInfoTest.txt`;
      lastFileSpeciesPair = `../docker/src/plugins/npasses/sync/utils/__tests__/data/speciesPairTest.txt`;
      lastTargetInfo = `../docker/src/plugins/npasses/sync/utils/__tests__/data/targetInfoTest.txt`;
      source = [
        lastFile,
        lastFileActivity,
        lastFileSpeciesProperties,
        lastFileSpeciesInfo,
        lastFileSpeciesPair,
        lastTargetInfo,
      ];
      sources = [source];
    } else {
      const sourceLinks = [
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_generalinfo.txt',
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_activities.txt',
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_structure.txt',
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_species_pair.txt',
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_species_info.txt',
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_target.txt',
      ];
      // check if link has changed
      await checkNpassesLink(sourceLinks, connection);

      let options = {
        collectionSource: sourceLinks[0],
        destinationLocal: `../originalData//npasses/full`,
        collectionName: 'npasses',
        filenameNew: 'general',
        extensionNew: 'txt',
      };
      // get last files available in the NPASS database
      lastFile = await getLastFileSync(options);
      options.collectionSource = sourceLinks[1];
      options.filenameNew = 'activities';
      lastFileActivity = await getLastFileSync(options);
      options.collectionSource = sourceLinks[2];
      options.filenameNew = 'properties';
      lastFileSpeciesProperties = await getLastFileSync(options);
      options.collectionSource = sourceLinks[3];
      options.filenameNew = 'speciesPair';
      lastFileSpeciesPair = await getLastFileSync(options);
      options.collectionSource = sourceLinks[4];
      options.filenameNew = 'speciesInfo';
      lastFileSpeciesInfo = await getLastFileSync(options);
      options.collectionSource = sourceLinks[5];
      options.filenameNew = 'targetInfo';
      lastTargetInfo = await getLastFileSync(options);
      // define sources
      source = [
        lastFile.replace(`../originalData/`, ''),
        lastFileActivity.replace(`../originalData/`, ''),
        lastFileSpeciesProperties.replace(`../originalData/`, ''),
        lastFileSpeciesInfo.replace(`../originalData/`, ''),
        lastFileSpeciesPair.replace(`../originalData/`, ''),
        lastTargetInfo.replace(`../originalData/`, ''),
      ];
      sources = [
        lastFile.replace(`../originalData/`, ''),
        lastFileActivity.replace(`../originalData/`, ''),
        lastFileSpeciesProperties.replace(`../originalData/`, ''),
        lastFileSpeciesInfo.replace(`../originalData/`, ''),
        lastFileSpeciesPair.replace(`../originalData/`, ''),
        lastTargetInfo.replace(`../originalData/`, ''),
      ];
    }
    // set logs
    const progress = await connection.getProgress('npasses');

    return {
      lastFile,
      lastFileActivity,
      lastFileSpeciesProperties,
      lastFileSpeciesInfo,
      lastFileSpeciesPair,
      lastTargetInfo,
      sources,
      progress,
    };
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'npasses',
        connection,
        stack: e.stack,
      });
    }
  }
}
