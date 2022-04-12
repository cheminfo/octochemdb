import firstBioassayImport from './firstBioassayImport.js';
import incrementalBioassayImport from './incrementalBioassayImport.js';

export async function sync(connection) {
  await firstBioassayImport(connection);
  // await incrementalBioassayImport(connection);
}
