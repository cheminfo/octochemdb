import debugLibrary from '../../../utils/Debug.js';

import getFileIfNew from './getFileIfNew.js';

const debug = debugLibrary(`getLastFileSync`);

/**
 * Download the latest source file for a collection, but only if it is newer
 * than the local copy (delegates the freshness check to `getFileIfNew`).
 * @param options - Sync options.
 * @param options.collectionName - Collection the file belongs to (for logging).
 * @param options.collectionSource - Remote source URL to fetch from.
 * @param options.destinationLocal - Local destination directory.
 * @param options.filenameNew - Base filename to write.
 * @param options.extensionNew - File extension to write.
 * @returns The resolved local file descriptor from `getFileIfNew`.
 */
export default async function getLastFileSync(options) {
  debug.trace(`Get last ${options.collectionName} file if new`);

  const source = options.collectionSource;
  const destination = options.destinationLocal;
  const fileName = options.filenameNew;
  const extension = options.extensionNew;
  debug.trace(`Syncing: ${source} to ${destination}`);
  return getFileIfNew({ url: source }, destination, {
    filename: fileName,
    extension,
  });
}
