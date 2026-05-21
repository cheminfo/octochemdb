import pkg from 'fs-extra';

import removeEntriesFromFile from '../../../../sync/utils/removeEntriesFromFile.js';
import debugLibrary from '../../../../utils/Debug.js';

import importOnePubmedFile from './importOnePubmedFile.js';

const { readFileSync } = pkg;

/**
 * Orchestrates the sequential import of a list of PubMed XML files.
 *
 * For `'first'` imports every `.gz` file is processed in order.
 * For `'incremental'` imports, `.gz` files are upserted while files
 * whose name starts with `'killed'` trigger deletion of the listed PMIDs.
 *
 * A language-code lookup table (`languagesPubMed.json`) is loaded once
 * and passed to each per-file import so that ISO language codes can be
 * expanded to full language names.
 * @param connection - Active database connection.
 * @param progress - Mutable progress document; updated in place.
 * @param files - Ordered list of files to process.
 * @param options - Resume context; `lastDocument`
 *   is the most recently imported document (used to skip already-processed
 *   entries within a partially-imported file).
 * @param pmidToCid - PMID → CID[] lookup map.
 * @param importType - Import mode.
 * @returns
 */
export async function importPubmedFiles(
  connection,
  progress,
  files,
  options,
  pmidToCid,
  importType,
) {
  const debug = debugLibrary('importPubmedFiles');

  // Load the ISO-639 language code → full-name map once for all files
  const langPubmeds = JSON.parse(
    readFileSync(
      'src/plugins/pubmeds/sync/utils/languagesPubMed.json',
    ).toString(),
  )[0];

  try {
    if (importType === 'first') {
      // For first import, skip entries until we pass the last imported seq
      options = { shouldImport: progress.seq === 0, ...options };
      for (const file of files) {
        await importOnePubmedFile(
          connection,
          progress,
          file,
          options,
          pmidToCid,
          langPubmeds,
        );
        // After the first file, always import (resume logic only applies once)
        options.shouldImport = true;
      }
    } else if (importType === 'incremental') {
      debug.info('Starting incremental update');
      // Skip entries in the first file if it was partially processed last run
      options = {
        shouldImport: progress.sources !== files[0].path,
        ...options,
      };
      for (const file of files) {
        debug.trace(`Processing: ${file.name}`);
        if (file.name.endsWith('.gz')) {
          await importOnePubmedFile(
            connection,
            progress,
            file,
            options,
            pmidToCid,
            langPubmeds,
          );
          options.shouldImport = true;
        } else if (file.name.startsWith('killed')) {
          // "killed" files list PMIDs that must be removed from the collection
          await removeEntriesFromFile(connection, 'pubmeds', file);
        }
      }
    }
  } catch (error) {
    if (connection) {
      const err = error instanceof Error ? error : new Error(String(error));
      await debug.fatal(err.message, {
        collection: 'pubmeds',
        connection,
        stack: err.stack,
      });
    }
  }
}
