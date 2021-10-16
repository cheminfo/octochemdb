import Debug from 'debug';
import delay from 'delay';

import aggregate from './aggregate/aggregate.js';
import firstCompoundImport from './compound/firstCompoundImport.js';
import incrementalCompoundImport from './compound/incrementalCompoundImport.js';
import firstSubstanceImport from './substance/firstSubstanceImport.js';
import incrementalSubstanceImport from './substance/incrementalSubstanceImport.js';

const debug = Debug('cron');

let sleepTime = 24; // in hours

cron();

async function cron() {
  // await firstCompoundImport();
  await firstSubstanceImport();
  while (true) {
    //  await incrementalCompoundImport();
    await incrementalSubstanceImport();
    await aggregate();
    for (let i = sleepTime; i > 0; i--) {
      debug(`${new Date().toISOString()} - Still waiting ${i}h`);
      await delay(3600 * 1000);
    }
  }
}
