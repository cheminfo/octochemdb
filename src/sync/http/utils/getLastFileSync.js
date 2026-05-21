import debugLibrary from '../../../utils/Debug.js';

import getFileIfNew from './getFileIfNew.js';

const debug = debugLibrary(`getLastFileSync`);

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
