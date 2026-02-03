import getLastFileSync from '../../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../../utils/Debug.js';
import { checkCmaupLink } from './checkCmaupLink.js';

const debug = debugLibrary('getCmaupsLastFiles');
/**
 * @description get necessary variables to start the sync
 * @param {*} connection the connection to the database
 * @returns {Promise<*>} lastFile, lastFileActivity, lastFileSpeciesAssociation, lastFileSpeciesInfo, sources, progress, logs
 */
export default async function getCmaupsLastFiles(connection) {
  try {
    let lastFileGeneral;
    let lastFileActivity;
    let lastFileSpeciesAssociation;
    let lastFileSpeciesInfo;
    let lastTargetInfo;
    let sources;

    if (process.env.NODE_ENV === 'test') {
      lastFileGeneral = `../docker/src/plugins/cmaups/sync/utils/__tests__/data/Ingredients.2023-10-23.txt`;
      lastFileActivity = `../docker/src/plugins/cmaups/sync/utils/__tests__/data/Activity.2023-10-23.txt`;
      lastFileSpeciesAssociation = `../docker/src/plugins/cmaups/sync/utils/__tests__/data/speciesAssociation.2023-10-23.txt`;
      lastFileSpeciesInfo = `../docker/src/plugins/cmaups/sync/utils/__tests__/data/speciesInfo.2023-10-23.txt`;
      lastTargetInfo = `../docker/src/plugins/cmaups/sync/utils/__tests__/data/targetAssociation.2023-10-23.txt`;
      sources = [
        lastFileGeneral,
        lastFileActivity,
        lastFileSpeciesAssociation,
        lastFileSpeciesInfo,
        lastTargetInfo,
      ];
    } else {
      const sourceLinks = [
        'https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Ingredients_All.txt',
        'https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Ingredient_Target_Associations_ActivityValues_References.txt',
        'https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Plant_Ingredient_Associations_onlyActiveIngredients.txt',
        'https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Plants.txt',
        'https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Targets.txt',
      ];
      await checkCmaupLink(sourceLinks, connection);
      let options = {
        collectionSource: sourceLinks[0],
        destinationLocal: `../originalData/cmaups/full`,
        collectionName: 'cmaups',
        filenameNew: 'Ingredients',
        extensionNew: 'txt',
      };

      // Get file Ingredients who contain general data about the molecule
      lastFileGeneral = await getLastFileSync(options);
      // Get file containing activity data for all active ingredients (lastFileGeneral)
      options.collectionSource = sourceLinks[1];
      options.filenameNew = 'activity';
      lastFileActivity = await getLastFileSync(options);
      // Get file Species association allows to relate mocule ID with taxonomies IDs
      options.collectionSource = sourceLinks[2];
      options.filenameNew = 'speciesAssociation';
      lastFileSpeciesAssociation = await getLastFileSync(options);
      // Get file with taxonomies informations
      options.collectionSource = sourceLinks[3];
      options.filenameNew = 'speciesInfo';
      lastFileSpeciesInfo = await getLastFileSync(options);
      // Get target info
      options.collectionSource = sourceLinks[4];
      options.filenameNew = 'targetInfo';
      lastTargetInfo = await getLastFileSync(options);

      // Get sources with new downloaded files (will be used to check if necessary to update collection)
      sources = [
        lastFileGeneral.replace(`../originalData/`, ''),
        lastFileActivity.replace(`../originalData/`, ''),
        lastFileSpeciesAssociation.replace(`../originalData/`, ''),
        lastFileSpeciesInfo.replace(`../originalData/`, ''),
        lastTargetInfo.replace(`../originalData/`, ''),
      ];
    }
    // Get collection admin
    const progress = await connection.getProgress('cmaups');

    return [
      lastFileGeneral,
      lastFileActivity,
      lastFileSpeciesAssociation,
      lastFileSpeciesInfo,
      lastTargetInfo,
      sources,
      progress,
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
