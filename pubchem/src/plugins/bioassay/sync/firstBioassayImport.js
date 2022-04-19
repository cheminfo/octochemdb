import Debug from '../../../utils/Debug.js';
import getFilesToImport from './utils/getFilesToImport.js';
import importBioassayFiles from './utils/importBioassayFiles.js';
import syncFullBioassayFolder from './utils/syncFullBioassayFolder.js';
const debug = Debug('firstBioassayImport');

async function firstBioassayImport(connection) {
  const allFiles = await syncFullBioassayFolder(debug);

  const progress = await connection.getProgress('bioassay');
  if (progress.state === 'update') {
    debug('First importation has been completed. Should only update.');
    return;
  } else {
    debug(`Continuing first importation.`);
  }
  const { files, lastDocument } = await getFilesToImport(
    connection,
    progress,
    allFiles,
    debug,
  );
  progress.state = 'updating';
  await connection.setProgress(progress);

  await importBioassayFiles(connection, progress, files);
  progress.state = 'update';
  progress.date = new Date();
  await connection.setProgress(progress);
}

export default firstBioassayImport;
