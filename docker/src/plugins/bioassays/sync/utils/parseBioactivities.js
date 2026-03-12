import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import debugLibrary from '../../../../utils/Debug.js';

import getBioassays from './getBioassays.js';

const debug = debugLibrary('parseBioactivities');

/**
 * Parses a gzipped tab-separated PubChem bioactivity dump file and yields one
 * `BioactivityEntry` document per active compound–assay pair found in the file.
 *
 * Bioassay metadata (name, target taxonomies) is pre-loaded from a separate
 * gzipped bioassay dump via `getBioassays()`. Compound OCL data is fetched
 * lazily from `collectionCompounds`; consecutive rows sharing the same CID
 * reuse the cached result without hitting the database again.
 *
 * @param {string} bioActivitiesFilePath - Absolute path to the gzipped TSV bioactivities dump file.
 * @param {string} bioassaysFilePath - Absolute path to the gzipped TSV bioassays dump file.
 * @param {OctoChemConnection} connection - Active OctoChemDB connection used for error reporting. Errors are persisted to the admin collection and monitored externally; no exception is re-thrown.
 * @param {CompoundCollection} collectionCompounds - MongoDB collection storing compound documents (keyed by numeric CID).
 * @param {TaxonomyCollection} collectionTaxonomies - MongoDB collection storing taxonomy documents (keyed by numeric taxon ID).
 * @param {DeprecatedTaxIdMap} oldToNewTaxIDs - Map of deprecated taxonomy IDs (keys) to their current replacement IDs (values).
 * @yields {BioactivityEntry} One document per active compound–assay pair.
 * @returns {AsyncGenerator<BioactivityEntry>}
 */
async function* parseBioactivities(
  bioActivitiesFilePath,
  bioassaysFilePath,
  connection,
  collectionCompounds,
  collectionTaxonomies,
  oldToNewTaxIDs,
) {
  try {
    // Pre-load all bioassay metadata so each yielded entry can be annotated inline.
    const bioassays = await getBioassays(
      bioassaysFilePath,
      connection,
      collectionTaxonomies,
      oldToNewTaxIDs,
    );
    // getBioassays returns undefined when a fatal error was already persisted;
    // nothing to iterate in that case.
    if (!bioassays) return;
    // Read stream of target file without unzip it
    const readStream = createReadStream(bioActivitiesFilePath);
    const stream = readStream.pipe(createGunzip());
    // Define variables
    let counter = 0;
    /** @type {CompoundTracker} */
    let compoundData = {
      cid: 0,
    };
    // Start parsing line by line the bioActivities file
    const lines = createInterface({ input: stream });
    for await (let line of lines) {
      const parts = line.split('\t');
      const aid = Number(parts[0]);
      const cid = Number(parts[3]);
      const activity = parts[4];
      // Only active molecules with a defined CID are kept.
      if (activity !== 'Active' || !cid) {
        continue;
      }
      // If the compound differs from the previous row, fetch its OCL data.
      if (compoundData.cid !== cid) {
        const compound = await collectionCompounds.findOne({ _id: cid });
        // Skip this row entirely if the compound is not in the database;
        // building a result with stale OCL data from the previous compound
        // would produce a document with a mismatched structure.
        if (compound === null) continue;
        compoundData.cid = cid;
        compoundData.idCode = compound.data?.ocl?.idCode;
        compoundData.noStereoTautomerID =
          compound.data?.ocl?.noStereoTautomerID;
        compoundData.coordinates = compound.data?.ocl?.coordinates;
      }

      // Guard against dump snapshot mismatches where an AID in the bioactivities
      // file has no corresponding entry in the pre-loaded bioassays map.
      if (!bioassays[aid]) continue;

      /** @type {BioactivityEntry} */
      const result = {
        _id: `${cid}_${aid}`,
        data: {
          cid,
          aid,
          assay: bioassays[aid].name,
          ocl: {
            idCode: compoundData.idCode,
            noStereoTautomerID: compoundData.noStereoTautomerID,
            coordinates: compoundData.coordinates,
          },
        },
      };
      if (bioassays[aid].targetTaxonomies) {
        result.data.targetTaxonomies = bioassays[aid].targetTaxonomies;
      }
      yield result;
      counter++;

      // In test mode, stop after a small sample to keep runs fast.
      if (connection) {
        if (process.env.NODE_ENV === 'test' && counter > 50) break;
      }
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'bioassays',
        connection,
        stack: err.stack,
      });
    }
  }
}

export default parseBioactivities;
