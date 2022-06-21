import firstSubstancesImport from './firstSubstancesImport.js';
import incrementalSubstancesImport from './incrementalSubstancesImport.js';
/**
 * @description start import of substances files and return the collection substances
 * @param {*} connection  - mongo connection
 */
export async function sync(connection) {
  await firstSubstancesImport(connection);
  await incrementalSubstancesImport(connection);
}
