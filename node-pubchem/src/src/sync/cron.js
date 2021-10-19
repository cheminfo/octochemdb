import Debug from 'debug';
import delay from 'delay';

import { PubChemConnection } from '../utils/PubChemConnection.js';
import { recursiveDir } from '../utils/recursiveDir.js';

const debug = Debug('cron');

let sleepTime = 24; // in hours

cron();

async function cron() {
  const url = new URL('../plugins/', import.meta.url);
  const syncURLs = (await recursiveDir(url)).filter(
    (file) =>
      file.href.match(/sync/) &&
      !file.href.match(/__tests__/) &&
      !file.href.match(/utils/) &&
      file.href.endsWith('.js'),
  );

  for (let syncURL of syncURLs) {
    const sync = await import(syncURL);
    if (typeof sync.sync !== 'function') continue;
    debug(`sync: ${syncURL.pathname}`);
    let connection;
    try {
      connection = new PubChemConnection();
      await sync.sync(connection);
    } catch (e) {
      console.log(e);
    } finally {
      debug('Closing connection');
      if (connection) await connection.close();
    }
  }

  const aggregateURLs = (await recursiveDir(url)).filter(
    (file) =>
      file.href.match(/aggregates/) &&
      !file.href.match(/__tests__/) &&
      !file.href.match(/utils/) &&
      file.href.endsWith('.js'),
  );

  for (let aggregateURL of aggregateURLs) {
    const aggregate = await import(aggregateURL);

    if (typeof aggregate.aggregate !== 'function') continue;
    debug(`aggregate: ${aggregateURL.pathname}`);
    let connection;
    try {
      connection = new PubChemConnection();
      await aggregate.aggregate(connection);
    } catch (e) {
      console.log(e);
    } finally {
      debug('Closing connection');
      if (connection) await connection.close();
    }
  }

  for (let i = sleepTime; i > 0; i--) {
    debug(`${new Date().toISOString()} - Still waiting ${i}h`);
    await delay(3600 * 1000);
  }
}
