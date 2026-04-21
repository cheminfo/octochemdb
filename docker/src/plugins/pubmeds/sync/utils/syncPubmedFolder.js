import syncFolder from '../../../../sync/http/utils/syncFolder.js';
import debugLibrary from '../../../../utils/Debug.js';

/**
 * Synchronises a remote PubMed FTP folder to local storage and returns
 * the list of `.gz` files available for import, sorted by path.
 *
 * For `'first'` imports the NCBI baseline directory is used; for
 * `'incremental'` imports the update-files directory is used.
 *
 * @param {OctoChemConnection} connection - Active database connection
 *   (used only for error logging on failure).
 * @param {'first' | 'incremental'} importType - Which remote folder to sync.
 * @returns {Promise<{ name: string; path: string }[] | undefined>} Sorted
 *   array of file descriptors, or `undefined` if a fatal error occurred.
 */
export async function syncPubmedFolder(connection, importType) {
  const debug = debugLibrary('syncFullPubmedFolder');
  try {
    debug.trace(`Synchronize ${importType} pubmed folder`);

    // Resolve source URL and local destination based on import type
    let source;
    let destination;
    if (importType === 'first') {
      source = `https://ftp.ncbi.nlm.nih.gov/pubmed/baseline/`;
      destination = `../originalData//pubmeds/full`;
    } else if (importType === 'incremental') {
      source = `https://ftp.ncbi.nlm.nih.gov/pubmed/updatefiles/`;
      destination = `../originalData//pubmeds/update`;
    }

    debug.trace(`Syncing: ${source} to ${destination}`);

    // Download any new/changed files and collect the full listing
    const { allFiles } = await syncFolder(source, destination, {
      fileFilter: (file) => file && file.name.endsWith('.gz'),
    });

    // Sort alphabetically by path so files are processed in order
    return allFiles.sort((a, b) => {
      if (a.path < b.path) return -1;
      if (a.path > b.path) return 1;
      return 0;
    });
  } catch (e) {
    if (connection) {
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'pubmeds',
        connection,
        stack: err.stack,
      });
    }
  }
}
