import { readFileSync } from 'fs';

import pkg from 'papaparse';

import debugLibrary from '../../../../utils/Debug.js';

const { parse } = pkg;
const debug = debugLibrary('readCmaupsFiles');

/**
 * Reads and parses the five CMAUP source files from the local filesystem and
 * returns the structured data needed by `parseCmaups()`.
 *
 * Each file is read synchronously with `readFileSync` and parsed with PapaParse:
 *  - `lastFileGeneral`            – parsed with `header: true`; produces `CmaupsGeneralRow[]`.
 *  - `lastFileActivity`           – parsed with `header: true`; rows are grouped by
 *                                   `Ingredient_ID` into a `CmaupsActivityMap`.
 *  - `lastFileSpeciesAssociation` – parsed with `header: false`; produces a
 *                                   `CmaupsSpeciesPairList` (2-column string matrix).
 *  - `lastFileSpeciesInfo`        – parsed with `header: true`; rows are keyed by
 *                                   `Plant_ID` into a `CmaupsSpeciesInfoMap`.
 *  - `lastTargetInfo`             – parsed with `header: true`; rows are keyed by
 *                                   `Target_ID` into a `CmaupsTargetInfoMap`.
 *
 * Errors are persisted to the admin MongoDB collection via `debug.fatal` and
 * are not re-thrown; the caller must handle the `undefined` return value.
 *
 * @param {string} lastFileGeneral - Local path to the Ingredients TSV file.
 * @param {string} lastFileActivity - Local path to the Activity TSV file.
 * @param {string} lastFileSpeciesAssociation - Local path to the speciesAssociation TSV file.
 * @param {string} lastFileSpeciesInfo - Local path to the Plants (species-info) TSV file.
 * @param {string} lastTargetInfo - Local path to the Targets TSV file.
 * @param {OctoChemConnection} connection - Active database connection wrapper.
 * @returns {CmaupsFilesData | undefined}
 */
export default function readCmaupsFiles(
  lastFileGeneral,
  lastFileActivity,
  lastFileSpeciesAssociation,
  lastFileSpeciesInfo,
  lastTargetInfo,
  connection,
) {
  try {
    // Read file containing molecule general data
    const general = parse(readFileSync(lastFileGeneral, 'utf8'), {
      header: true,
    }).data;
    // Read activities file
    /** @type {CmaupsActivityMap} */
    const activities = {};
    parse(readFileSync(lastFileActivity, 'utf8'), {
      header: true,
    }).data.forEach((entry) => {
      if (!activities[entry.Ingredient_ID]) {
        activities[entry.Ingredient_ID] = [];
      }
      activities[entry.Ingredient_ID].push(entry);
    });
    // Read species association file
    // Column schema (0-based): [ Plant_ID, Ingredient_ID ]
    const speciesPair = parse(
      readFileSync(lastFileSpeciesAssociation, 'utf8'),
      {
        header: false,
      },
    ).data;
    // Read species info file
    /** @type {CmaupsSpeciesInfoMap} */
    const speciesInfo = {};
    parse(readFileSync(lastFileSpeciesInfo, 'utf8'), {
      header: true,
    }).data.forEach((entry) => {
      speciesInfo[entry.Plant_ID] = entry;
    });
    // Read target info file
    /** @type {CmaupsTargetInfoMap} */
    const targetInfo = {};
    parse(readFileSync(lastTargetInfo, 'utf8'), {
      header: true,
    }).data.forEach((entry) => {
      targetInfo[entry.Target_ID] = entry;
    });

    return { general, activities, speciesPair, speciesInfo, targetInfo };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    // If error is caught, persist it to the admin collection for external monitoring
    if (connection) {
      debug.fatal(err.message, {
        collection: 'cmaups',
        connection,
        stack: err.stack,
      });
    }
  }
}
