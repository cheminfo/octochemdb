import firstSubstancesImport from './firstSubstancesImport.js';
import incrementalSubstancesImport from './incrementalSubstancesImport.js';

export async function sync(connection) {
  await firstSubstancesImport(connection);
  await incrementalSubstancesImport(connection);
}
