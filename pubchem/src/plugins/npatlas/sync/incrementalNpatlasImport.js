import Debug from 'debug';

import syncFolder from '../../../sync/http/utils/syncFolder.js';

import firstNpatlasImport from './firstNpatlasImport.js';
import importOneNpatlasFile from './utils/importOneNpatlasFile.js';

const debug = Debug('incrementalNpatlasImport');

async function incrementalNpatlasImport(connection) {
  return firstNpatlasImport(connection);
}

export default incrementalNpatlasImport;
