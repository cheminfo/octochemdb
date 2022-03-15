import firstNpatlasImport from './firstNpatlasImport.js';
import incrementalNpatlasImport from './incrementalNpatlasImport.js';

export async function sync(connection) {
  await firstNpatlasImport(connection);
  await incrementalNpatlasImport(connection);
}
