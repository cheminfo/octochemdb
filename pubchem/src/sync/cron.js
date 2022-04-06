import delay from 'delay';

import Debug from '../utils/Debug.js';
import { PubChemConnection } from '../utils/PubChemConnection.js';
import { recursiveDir } from '../utils/recursiveDir.js';

const debug = Debug('cron');

let sleepTime = 24; // in hours

cron();

async function cron() {
  const url = new URL('../plugins/', import.meta.url);
  let syncURLs = (await recursiveDir(url)).filter(
    (file) =>
      file.href.match(/sync/) &&
      !file.href.match(/__tests__/) &&
      !file.href.match(/utils/) &&
      file.href.endsWith('.js'),
  );
  if (process.env.PLUGINS) {
    const allowedPlugins = process.env.PLUGINS.split(',');
    syncURLs = syncURLs.filter((url) => {
      const pluginName = url.pathname.replace(/.*plugins\/\/?(.*?)\/.*/, '$1');
      if (allowedPlugins.includes(pluginName)) return true;
      return false;
    });
  }

  for (let syncURL of syncURLs) {
    const sync = await import(syncURL);
    if (typeof sync.sync !== 'function') continue;
    debug(`sync: ${syncURL.pathname}`);
    let connection;
    try {
      connection = new PubChemConnection();
      await sync.sync(connection);
    } catch (e) {
      debug(e.stack);
    } finally {
      debug('Closing connection');
      if (connection) await connection.close();
    }
  }

  let aggregateURLs = (await recursiveDir(url)).filter(
    (file) =>
      file.href.match(/aggregates/) &&
      !file.href.match(/__tests__/) &&
      !file.href.match(/utils/) &&
      file.href.endsWith('.js'),
  );
  if (process.env.PLUGINS) {
    const allowedPlugins = process.env.PLUGINS.split(',');
    aggregateURLs = aggregateURLs.filter((url) => {
      const pluginName = url.pathname.replace(/.*plugins\/\/?(.*?)\/.*/, '$1');
      if (allowedPlugins.includes(pluginName)) return true;
      return false;
    });
  }

  for (let aggregateURL of aggregateURLs) {
    const aggregate = await import(aggregateURL);

    if (typeof aggregate.aggregate !== 'function') continue;
    debug(`aggregate: ${aggregateURL.pathname}`);
    let connection;
    try {
      connection = new PubChemConnection();
      await aggregate.aggregate(connection);
    } catch (e) {
      debug(e.stack);
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
