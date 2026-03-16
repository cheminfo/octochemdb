import getLastFileSync from '../../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../../utils/Debug.js';

import { checkNpassesLink } from './checkNpassesLink.js';

/**
 * Resolves all six NPASS TSV source files that the sync pipeline needs.
 *
 * In **test mode** (`NODE_ENV === 'test'`) the function returns hard-coded
 * paths that point to small fixture files bundled in the `__tests__/data`
 * directory so that unit tests run without network access.
 *
 * In **production mode** it:
 * 1. Validates that the remote download URLs are still referenced on the
 *    NPASS website (via {@link checkNpassesLink}).
 * 2. Calls `getLastFileSync` for each of the six TSV endpoints to download
 *    (or reuse cached) copies under `../originalData/npasses/full/`.
 * 3. Builds a `sources` fingerprint array (relative paths) so that the
 *    caller can compute an md5 hash for change-detection.
 *
 * @param {OctoChemConnection} connection - Active database connection used
 *   both for logging fatal errors and for retrieving the sync progress doc.
 * @returns {Promise<NpassesLastFiles | undefined>} Resolved file paths,
 *   source fingerprints, and the current sync progress – or `undefined` if
 *   an error is caught and logged.
 */
export default async function getNpassesLastFiles(connection) {
  const debug = debugLibrary('getNpassesLastFiles');
  try {
    let lastFile;
    let lastFileActivity;
    let lastFileSpeciesProperties;
    let lastFileSpeciesInfo;
    let lastFileSpeciesPair;
    let lastTargetInfo;
    let sources;
    // --- Test mode: use local fixture files (no network) ---
    if (process.env.NODE_ENV === 'test') {
      lastFile = `../docker/src/plugins/npasses/sync/utils/__tests__/data/generalTest.txt`;
      lastFileActivity = `../docker/src/plugins/npasses/sync/utils/__tests__/data/activitiesTest.txt`;
      lastFileSpeciesProperties = `../docker/src/plugins/npasses/sync/utils/__tests__/data/propertiesTest.txt`;
      lastFileSpeciesInfo = `../docker/src/plugins/npasses/sync/utils/__tests__/data/speciesInfoTest.txt`;
      lastFileSpeciesPair = `../docker/src/plugins/npasses/sync/utils/__tests__/data/speciesPairTest.txt`;
      lastTargetInfo = `../docker/src/plugins/npasses/sync/utils/__tests__/data/targetInfoTest.txt`;
      // In test mode the sources list is just the local test file paths
      sources = [
        lastFile,
        lastFileActivity,
        lastFileSpeciesProperties,
        lastFileSpeciesInfo,
        lastFileSpeciesPair,
        lastTargetInfo,
      ];
    } else {
      // --- Production mode: download from NPASS remote servers ---
      // Canonical NPASS 3.0 download URLs – order matters (indexes used below)
      const sourceLinks = [
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_generalinfo.txt',
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_activities.txt',
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_structure.txt',
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_species_pair.txt',
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_species_info.txt',
        'https://bidd.group/NPASS/downloadFiles/NPASS3.0_target.txt',
      ];
      // Verify remote URLs haven't moved; logs a fatal warning if any are missing
      await checkNpassesLink(sourceLinks, connection);

      const options = {
        collectionSource: sourceLinks[0],
        destinationLocal: `../originalData/npasses/full`,
        collectionName: 'npasses',
        filenameNew: 'general',
        extensionNew: 'txt',
      };
      // Download each TSV file (or reuse cached copy) via getLastFileSync.
      // We reuse the same `options` object, swapping source URL and local filename.
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
      // Build relative source paths used for md5 fingerprinting (change detection)
      sources = [
        lastFile.replace(`../originalData/`, ''),
        lastFileActivity.replace(`../originalData/`, ''),
        lastFileSpeciesProperties.replace(`../originalData/`, ''),
        lastFileSpeciesInfo.replace(`../originalData/`, ''),
        lastFileSpeciesPair.replace(`../originalData/`, ''),
        lastTargetInfo.replace(`../originalData/`, ''),
      ];
    }
    // Retrieve the current sync progress document from MongoDB
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
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'npasses',
        connection,
        stack: err.stack,
      });
    }
  }
}
