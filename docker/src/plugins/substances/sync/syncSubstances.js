import firstSubstancesImport from './firstSubstancesImport.js';
import incrementalSubstancesImport from './incrementalSubstancesImport.js';

/**
 * Main entry-point for the PubChem Substance synchronisation job.
 *
 * Workflow:
 * 1. Run a full (first) import that processes every SDF file in the
 *    CURRENT-Full dump, resuming from the last processed file/document.
 * 2. Run an incremental import that applies weekly delta files
 *    (new substances and killed-SID removals).
 *
 * @param {OctoChemConnection} connection - MongoDB connection wrapper
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  await firstSubstancesImport(connection);
  await incrementalSubstancesImport(connection);
}
