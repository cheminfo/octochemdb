import importOneBioassayFile from './importOneBioassayFile.js';
import md5 from 'md5';
async function importBioassayFiles(connection, progress, files) {
  let i = 0;
  for (let file of files) {
    const logs = await connection.geImportationtLog({
      collectionName: 'bioassay',
      sources: md5(file.name),
      startSequenceID: progress.seq,
    });
    i++;
    if (i > 2) break;
    await importOneBioassayFile(connection, progress, file);
    logs.dateEnd = Date.now();
    logs.endSequenceID = progress.seq;
    await connection.updateImportationLog(logs);
  }
}
export default importBioassayFiles;
