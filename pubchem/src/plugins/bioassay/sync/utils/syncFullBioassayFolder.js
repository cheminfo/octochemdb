import syncFolder from '../../../../sync/http/utils/syncFolder.js';

async function syncFullBioassayFolder(debug) {
  debug('Synchronize full substance folder');

  const source = `${process.env.BIOASSAY_SOURCE}`;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/bioassay/full`;

  debug(`Syncing: ${source} to ${destination}`);

  const { allFiles } = await syncFolder(source, destination, {
    fileFilter: (file) => file && file.name.endsWith('.zip'),
  });

  return allFiles.sort((a, b) => {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
  });
}
export default syncFullBioassayFolder;
