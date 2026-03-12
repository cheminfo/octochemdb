import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('getBioassays');

/**
 * Parses a gzipped tab-separated PubChem bioassay dump file and returns a map
 * of assay entries ready for insertion into the database.
 *
 * Each line of the dump (after the header) represents one bioassay identified
 * by its AID. Taxonomy IDs found in the `targetTaxIDs` and `taxonomyIDs`
 * columns are resolved against the `collectionTaxonomies` MongoDB collection;
 * any deprecated IDs are translated via `oldToNewTaxIDs` before the lookup.
 *
 * @param {string} bioassaysFilePath - Absolute path to the gzipped TSV bioassay dump file.
 * @param {OctoChemConnection} connection - Active OctoChemDB connection used for error reporting. Errors are persisted to the admin collection and monitored externally; no exception is re-thrown.
 * @param {TaxonomyCollection} collectionTaxonomies - MongoDB collection storing taxonomy documents (keyed by numeric taxon ID).
 * @param {DeprecatedTaxIdMap} oldToNewTaxIDs - Map of deprecated taxonomy IDs (keys) to their current replacement IDs (values).
 * @returns {BioassayResult} Resolves with a map of AID → bioassay entry, or `undefined` if a fatal error occurred.
 */
export default async function getBioassays(
  bioassaysFilePath,
  connection,
  collectionTaxonomies,
  oldToNewTaxIDs,
) {
  try {
    // Decompress the gzipped dump on-the-fly and feed it into a line reader.
    const readStream = createReadStream(bioassaysFilePath);
    const stream = readStream.pipe(createGunzip());
    /** @type {BioassayMap} */
    const bioassays = {};
    debug.trace('Start parsing bioassays file');
    let counter = 0;
    let start = Date.now();
    // Pre-compute the set of deprecated IDs to avoid re-calling Object.keys() in the hot loop.
    let oldIDs = Object.keys(oldToNewTaxIDs);
    const lines = createInterface({ input: stream });

    for await (let line of lines) {
      // Columns follow the PubChem bioassay TSV schema:
      // AID | Name | DepositDate | ModifyDate | SourceName | SourceID |
      // SubstanceType | OutcomeType | ProjectCategory | BioAssayGroup |
      // BioAssayTypes | ProteinAccessions | UniProtIDs | GeneIDs |
      // TargetTaxIDs | TaxonomyIDs
      // The commas are placeholders for the unused columns; we only care about a subset of the fields.
      const [
        aid,
        name, 
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        targetTaxIDs,
        taxonomyIDs,
      ] = line.split('\t');

      if (aid === 'AID') continue; // skip the header row

      // Initialise the entry with only the assay name; taxonomy data is added below.
      bioassays[aid] = { name };

      /**
       * Collect the unique taxonomy IDs for this assay from both taxonomy columns.
       * Using an object (keyed by ID) deduplicates entries that appear in both columns.
       * The values are unused placeholder arrays; only the keys (IDs) matter.
       * @type {TaxonomyIdSet}
       */
      let targetTaxonomies = {};

      // `taxonomyIDs` contains identifiers derived from `targetTaxIDs` plus
      // depositor-supplied links; both columns can carry pipe-separated IDs.
      if (taxonomyIDs) {
        if (taxonomyIDs.includes('|')) {
          taxonomyIDs.split('|').forEach((entry) => {
            targetTaxonomies[entry] = [];
          });
        } else {
          targetTaxonomies[taxonomyIDs] = [];
        }
      }
      if (targetTaxIDs) {
        if (targetTaxIDs.includes('|')) {
          targetTaxIDs.split('|').forEach((entry) => {
            targetTaxonomies[entry] = [];
          });
        } else {
          targetTaxonomies[targetTaxIDs] = [];
        }
      }

      // Resolve each collected taxonomy ID to a full taxonomy document.
      if (Object.keys(targetTaxonomies).length > 0) {
        /** @type {TaxonomyDataList} */
        let taxonomies = [];
        for (const taxId of Object.keys(targetTaxonomies)) {
          // Translate deprecated IDs to their current replacements before querying.
          let idToUse = Number(taxId);
          if (oldIDs.includes(taxId)) {
            idToUse = Number(oldToNewTaxIDs[taxId]);
          }
          const taxonomy = await collectionTaxonomies.findOne({ _id: idToUse });
          if (taxonomy !== null && taxonomy.data !== undefined) {
            taxonomies.push(taxonomy.data);
          }
        }
        if (taxonomies.length > 0) {
          bioassays[aid].targetTaxonomies = taxonomies;
        }
      }

      // Emit a throttled progress trace so as not to flood the log.
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
        debug.trace(`Processed: ${counter} assays`);
        start = Date.now();
      }
      counter++;
    }
    return bioassays;
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
