import firstPubmedsImport from './firstPubmedsImport.js';
import incrementalPubmedsImport from './incrementalPubmedsImport.js';

export async function sync(connection) {
  await firstPubmedsImport(connection);
  await incrementalPubmedsImport(connection);
}
