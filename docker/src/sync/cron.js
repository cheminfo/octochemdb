import delay from 'delay';

import debugLibrary from '../utils/Debug.js';
import { OctoChemConnection } from '../utils/OctoChemConnection.js';
import { recursiveDir } from '../utils/recursiveDir.js';

const debug = debugLibrary('cron');

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
      const pluginName = url.pathname.replace(
        /.*plugins\/\/?(?<temp1>.*?)\/.*/,
        '$1',
      );

      if (allowedPlugins.includes(pluginName)) return true;
      return false;
    });
  }
  if (process.env.EXCLUDEPLUGINS) {
    const notAllowedPlugins = process.env.EXCLUDEPLUGINS.split(',');
    syncURLs = syncURLs.filter((url) => {
      const pluginName = url.pathname.replace(
        /.*plugins\/\/?(?<temp2>.*?)\/.*/,
        '$1',
      );
      if (!notAllowedPlugins.includes(pluginName)) return true;
      return false;
    });
  }
  for (let syncURL of syncURLs) {
    if (
      syncURL.pathname.includes('syncTaxonomies') ||
      syncURL.pathname.includes('syncCompounds')
    ) {
      syncURLs.unshift(syncURLs.splice(syncURLs.indexOf(syncURL), 1)[0]);
    }
  }
  for (let syncURL of syncURLs) {
    const sync = await import(syncURL);
    if (typeof sync.sync !== 'function') continue;
    debug.trace(`sync: ${syncURL.pathname}`);
    let connection;
    try {
      connection = new OctoChemConnection();
      await sync.sync(connection);
    } catch (e) {
      debug.fatal(e.stack);
    } finally {
      debug.trace('Closing connection');
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
      const pluginName = url.pathname.replace(
        /.*plugins\/\/?(?<temp3>.*?)\/.*/,
        '$1',
      );
      if (allowedPlugins.includes(pluginName)) return true;
      return false;
    });
  }
  for (let aggregateURL of aggregateURLs) {
    if (aggregateURL.pathname.includes('activesOrNaturals')) {
      aggregateURLs.unshift(
        aggregateURLs.splice(aggregateURLs.indexOf(aggregateURL), 1)[0],
      );
    }
  }
  for (let aggregateURL of aggregateURLs) {
    const aggregate = await import(aggregateURL);

    if (typeof aggregate.aggregate !== 'function') continue;
    debug.trace(`aggregate: ${aggregateURL.pathname}`);
    let connection;
    try {
      connection = new OctoChemConnection();
      await aggregate.aggregate(connection);
    } catch (e) {
      debug.fatal(e.stack);
    } finally {
      debug.trace('Closing connection');
      if (connection) await connection.close();
    }
  }

  for (let i = sleepTime; i > 0; i--) {
    debug.info(`${new Date().toISOString()} - Still waiting ${i}h`);
    await delay(3600 * 1000);
  }
}
