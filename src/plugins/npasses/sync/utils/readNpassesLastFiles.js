import { readFileSync } from 'node:fs';

import pkg from 'papaparse';

import debugLibrary from '../../../../utils/Debug.js';

const { parse } = pkg;

/**
 * Reads all six locally-downloaded NPASS TSV files from disk, parses them
 * with PapaParse, and returns a set of lookup maps ready for consumption
 * by {@link parseNpasses}.
 *
 * The TSV files use `\t` as the delimiter and the first row of each file
 * is treated as a header row (PapaParse `header: true`).  The function
 * builds several lookup structures:
 *   - `general`  – plain array of general-info rows (iterated sequentially).
 *   - `activities` – `np_id` → `NpassesActivityRow[]` (many activities per
 *     compound).
 *   - `properties` – `np_id` → `NpassesPropertyRow` (one-to-one).
 *   - `speciesPair` – `np_id` → `string[]` of `org_id` values.
 *   - `speciesInfo` – `org_id` → `NpassesSpeciesInfoRow` (one-to-one).
 *   - `targetInfo` – `target_id` → `NpassesTargetInfoRow` (one-to-one).
 * @param lastFile - Absolute or relative path to the NPASS
 *   general-info TSV file.
 * @param lastFileActivity - Path to the activities TSV file.
 * @param lastFileSpeciesProperties - Path to the properties
 *   (structural data) TSV file.
 * @param lastFileSpeciesInfo - Path to the species-info TSV file.
 * @param lastFileSpeciesPair - Path to the species-pair TSV file.
 * @param lastTargetInfo - Path to the target-info TSV file.
 * @param connection - Database connection or
 *   `'test'`; only used for fatal error logging.
 * @returns Parsed lookup maps, or
 *   `undefined` if an I/O or parsing error occurs.
 */
export default async function readNpassesLastFiles(
  lastFile,
  lastFileActivity,
  lastFileSpeciesProperties,
  lastFileSpeciesInfo,
  lastFileSpeciesPair,
  lastTargetInfo,
  connection,
) {
  const debug = debugLibrary('readNpassesLastFiles');
  try {
    // Parse the general-info TSV – produces the main row array iterated in parseNpasses
    const general = parse(readFileSync(lastFile, 'utf8'), {
      header: true,
    }).data;
    // Build an np_id → activity-rows map (a compound can have many activities)
    /** @type {NpassesActivityMap} */
    const activities = {};
    for (const entry of parse(readFileSync(lastFileActivity, 'utf8'), {
      header: true,
    }).data) {
      if (!activities[entry.np_id]) {
        activities[entry.np_id] = [];
      }
      activities[entry.np_id].push(entry);
    }
    // Build an np_id → property-row map (one structure per compound)
    /** @type {NpassesPropertyMap} */
    const properties = {};
    for (const entry of parse(readFileSync(lastFileSpeciesProperties, 'utf8'), {
      header: true,
      delimiter: '\t',
    }).data) {
      properties[entry.np_id] = entry;
    }

    // Build an np_id → org_id[] map linking compounds to source organisms
    /** @type {NpassesSpeciesPairMap} */
    const speciesPair = {};
    for (const entry of parse(readFileSync(lastFileSpeciesPair, 'utf-8'), {
      header: true,
    }).data) {
      if (!speciesPair[entry.np_id] && entry.np_id !== undefined) {
        speciesPair[entry.np_id] = [];
      }
      if (entry.np_id !== undefined) {
        speciesPair[entry.np_id].push(entry.org_id);
      }
    }

    // Build an org_id → species-info-row map for full taxonomy resolution
    /** @type {NpassesSpeciesInfoMap} */
    const speciesInfo = {};
    for (const entry of parse(readFileSync(lastFileSpeciesInfo, 'utf8'), {
      header: true,
    }).data) {
      speciesInfo[entry.org_id] = entry;
    }

    // Build a target_id → target-info-row map for bioactivity enrichment
    /** @type {NpassesTargetInfoMap} */
    const targetInfo = {};
    for (const entry of parse(readFileSync(lastTargetInfo, 'utf8'), {
      header: true,
    }).data) {
      targetInfo[entry.target_id] = entry;
    }
    // return data
    return {
      general,
      activities,
      properties,
      speciesPair,
      speciesInfo,
      targetInfo,
    };
  } catch (error) {
    if (connection) {
      const err = error instanceof Error ? error : new Error(String(error));
      await debug.fatal(err.message, {
        collection: 'npasses',
        connection,
        stack: err.stack,
      });
    }
  }
}
