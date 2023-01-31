import firstCompoundsImport from './firstCompoundsImport.js';
import incrementalCompoundsImport from './incrementalCompoundsImport.js';
/**
 * @description Synchronize the compounds database from the pubchem database
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns compounds collections
 */
export async function sync(connection) {
  // Do the first importation
  await firstCompoundsImport(connection);
  // Do the incremental updates
  // await incrementalCompoundsImport(connection);
}
