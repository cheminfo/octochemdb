import firstPubmedsImport from './firstPubmedsImport.js';
import incrementalPubmedsImport from './incrementalPubmedsImport.js';
/**
 * @description perform first and incremental import of pubmeds
 * @param {*} connection - mongo connection
 */
export async function sync(connection) {
  await firstPubmedsImport(connection);
  await incrementalPubmedsImport(connection);
}
