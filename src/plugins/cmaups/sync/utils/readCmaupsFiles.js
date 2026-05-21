import { readFileSync } from 'node:fs';

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
 * @param lastFileGeneral - Local path to the Ingredients TSV file.
 * @param lastFileActivity - Local path to the Activity TSV file.
 * @param lastFileSpeciesAssociation - Local path to the speciesAssociation TSV file.
 * @param lastFileSpeciesInfo - Local path to the Plants (species-info) TSV file.
 * @param lastTargetInfo - Local path to the Targets TSV file.
 * @param connection - Active database connection wrapper.
 * @returns
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
    for (const entry of parse(readFileSync(lastFileActivity, 'utf8'), {
      header: true,
    }).data) {
      if (!activities[entry.Ingredient_ID]) {
        activities[entry.Ingredient_ID] = [];
      }
      activities[entry.Ingredient_ID].push(entry);
    }
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
    for (const entry of parse(readFileSync(lastFileSpeciesInfo, 'utf8'), {
      header: true,
    }).data) {
      speciesInfo[entry.Plant_ID] = entry;
    }
    // Read target info file
    /** @type {CmaupsTargetInfoMap} */
    const targetInfo = {};
    for (const entry of parse(readFileSync(lastTargetInfo, 'utf8'), {
      header: true,
    }).data) {
      targetInfo[entry.Target_ID] = entry;
    }

    return { general, activities, speciesPair, speciesInfo, targetInfo };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
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
