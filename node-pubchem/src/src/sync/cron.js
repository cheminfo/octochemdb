'use strict';

const delay = require('delay');
const debug = require('debug')('cron');

const aggregate = require('../aggregates/aggregate');

const firstCompoundImport = require('./compound/firstCompoundImport');
//const incrementalImport = require('./incrementalImport');

let sleepTime = 24; // in hours

cron();

async function cron() {
  // waiting for mongo

  // await delay(30 * 1000); // wating 30s before starting
  await firstCompoundImport();
  return;
  while (true) {
    await incrementalImport();
    await aggregate();
    for (let i = sleepTime; i > 0; i--) {
      debug(`${new Date().toISOString()} - Still wating ${i}h`);
      await delay(3600 * 1000);
    }
  }
}
