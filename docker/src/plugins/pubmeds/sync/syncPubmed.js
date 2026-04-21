import firstPubmedsImport from './firstPubmedsImport.js';
import incrementalPubmedsImport from './incrementalPubmedsImport.js';

/**
 * Main entry-point for the PubMed synchronisation job.
 *
 * Executes two sequential phases:
 * 1. **First import** — bulk-loads the PubMed baseline dump files into the
 *    `pubmeds` MongoDB collection.  Skips entirely when the baseline has
 *    already been fully imported (progress state === `'updated'`).
 * 2. **Incremental import** — applies update/delete files published after
 *    the baseline snapshot, keeping the local collection in sync with NCBI.
 *
 * @param {OctoChemConnection} connection - Active database connection
 *   providing access to collections, progress documents, and error logging.
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  await firstPubmedsImport(connection);
  await incrementalPubmedsImport(connection);
}
