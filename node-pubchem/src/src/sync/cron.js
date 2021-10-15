'use strict';

const delay = require('delay');

const aggregate = require('./aggregate/aggregate');

const debug = require('debug')('cron');

const firstCompoundImport = require('./compound/firstCompoundImport');
const incrementalCompoundImport = require('./compound/incrementalCompoundImport');
const firstSubstanceImport = require('./substance/firstSubstanceImport');
const incrementalSubstanceImport = require('./substance/incrementalSubstanceImport');

let sleepTime = 24; // in hours

cron();

async function cron() {
  await firstCompoundImport();
  await firstSubstanceImport();
  while (true) {
    await incrementalCompoundImport();
    await incrementalSubstanceImport();
    await aggregate();
    for (let i = sleepTime; i > 0; i--) {
      debug(`${new Date().toISOString()} - Still waiting ${i}h`);
      await delay(3600 * 1000);
    }
  }
}
