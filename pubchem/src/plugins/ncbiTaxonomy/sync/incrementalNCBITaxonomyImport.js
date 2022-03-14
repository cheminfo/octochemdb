import Debug from 'debug';

import syncFolder from '../../../sync/http/utils/syncFolder.js';

import firstNCBITaxonomyImport from './firstNCBITaxonomyImport.js';
import importOneTaxonomyFile from './utils/importOneTaoxonomyFile.js';

const debug = Debug('incrementalNCBITaxonomyImport');

async function incrementalNCBITaxonomyImport(connection) {
  return firstNCBITaxonomyImport(connection);
}

export default incrementalNCBITaxonomyImport;
