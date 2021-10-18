import firstCompoundsImport from './firstCompoundsImport.js';
import incrementalCompoundsImport from './incrementalCompoundsImport.js';

export async function sync(connection) {
  await firstCompoundsImport(connection);
  await incrementalCompoundsImport(connection);
}
