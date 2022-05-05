import Debug from '../../../utils/Debug.js';

import getFileIfNew from './getFileIfNew.js';

async function getLastFileSync(options) {
  const debug = Debug(`SyncLast ${options.collectionName}`);
  debug(`Get last ${options.collectionName} file if new`);

  const source = options.collectionSource;
  const destination = options.destinationLocal;
  const fileName = options.filenameNew;
  const extension = options.extensionNew;
  debug(`Syncing: ${source} to ${destination}`);
  return getFileIfNew({ url: source }, destination, {
    filename: fileName,
    extension: extension,
  });
}

export default getLastFileSync;
