'use strict';

const delay = require('delay');

const aggregate = require('../aggregates/aggregate');

const firstImport = require('./firstImport');
const update = require('./update');

let sleepTime = 24; // in hours

cron();

async function cron() {
  // waiting for mongo

  // await delay(30 * 1000); // wating 30s before starting
  await firstImport();
  while (true) {
    await update();
    await aggregate();
    for (let i = sleepTime; i > 0; i--) {
      console.log(`${new Date().toISOString()} - Still wating ${i}h`);
      await delay(3600 * 1000);
    }
  }
}
