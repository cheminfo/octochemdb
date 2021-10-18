import firstSubstancesImport from './firstSubstancesImport.js';
import incrementalSubstancesImport from './incrementalSubstancesImport.js';

async function sync(connection) {
  await firstSubstancesImport(connection);
  await incrementalSubstancesImport(connection);
}

export default {
  sync,
};
