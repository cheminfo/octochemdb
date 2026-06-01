import delay from 'delay';

import debugLibrary from '../utils/Debug.js';
import { OctoChemConnection } from '../utils/OctoChemConnection.js';
import { recursiveDir } from '../utils/recursiveDir.js';

const debug = debugLibrary('cron');

const sleepTime = 24; // in hours

// Sync plugins run in this order. Plugins not listed run after these,
// in alphabetical order. Mirrors the dependency graph used by tests.
const SYNC_PRIORITY = [
  'taxonomies',
  'compounds',
  'bioassays',
  'patents',
  'compoundPatents',
  'gnps',
];

// Aggregates that must run before others (e.g. activesOrNaturals is
// read by inSilicoFragments and other aggregates).
const AGGREGATE_PRIORITY = ['activesOrNaturals'];

const PLUGIN_NAME_RE = /.*plugins\/\/?(?<name>[^/]+)\/.*/;

function pluginNameFromUrl(url) {
  return url.pathname.replace(PLUGIN_NAME_RE, '$1');
}

function applyEnvFilters(urls) {
  let result = urls;
  if (process.env.PLUGINS) {
    const allowed = new Set(process.env.PLUGINS.split(','));
    result = result.filter((u) => allowed.has(pluginNameFromUrl(u)));
  }
  if (process.env.EXCLUDEPLUGINS) {
    const excluded = new Set(process.env.EXCLUDEPLUGINS.split(','));
    result = result.filter((u) => !excluded.has(pluginNameFromUrl(u)));
  }
  return result;
}

function sortByPriority(urls, priorityList) {
  const priority = new Map(priorityList.map((name, i) => [name, i]));
  return [...urls].sort((a, b) => {
    const pa = priority.get(pluginNameFromUrl(a)) ?? Infinity;
    const pb = priority.get(pluginNameFromUrl(b)) ?? Infinity;
    if (pa !== pb) return pa - pb;
    return a.pathname.localeCompare(b.pathname);
  });
}

cron();

async function cron() {
  const url = new URL('../plugins/', import.meta.url);
  const connection = new OctoChemConnection();

  const allFiles = (await recursiveDir(url)).filter(
    (file) =>
      !file.href.match(/__tests__/) &&
      !file.href.match(/utils/) &&
      file.href.endsWith('.js'),
  );

  const syncURLs = sortByPriority(
    applyEnvFilters(allFiles.filter((file) => file.href.match(/sync/))),
    SYNC_PRIORITY,
  );

  for (const syncURL of syncURLs) {
    const sync = await import(syncURL);
    if (typeof sync.sync !== 'function') continue;
    debug.trace(`sync: ${syncURL.pathname}`);
    try {
      await sync.sync(connection);
    } catch (error) {
      debug.fatal(error.stack);
    }
  }

  const aggregateURLs = sortByPriority(
    applyEnvFilters(allFiles.filter((file) => file.href.match(/aggregates/))),
    AGGREGATE_PRIORITY,
  );

  for (const aggregateURL of aggregateURLs) {
    const aggregate = await import(aggregateURL);
    if (typeof aggregate.aggregate !== 'function') continue;
    debug.trace(`aggregate: ${aggregateURL.pathname}`);
    try {
      await aggregate.aggregate(connection);
    } catch (error) {
      debug.fatal(error.stack);
    }
  }

  debug.trace('Closing connection');
  await connection.close();

  for (let i = sleepTime; i > 0; i--) {
    debug.info(`${new Date().toISOString()} - Still waiting ${i}h`);
    await delay(3600 * 1000);
  }
}
