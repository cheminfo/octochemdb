import { firstNCBITaxonomyImport } from './firstNCBITaxonomyImport.js';
import { incrementalNCBITaxonomyImport } from './incrementalNCBITaxonomyImport.js';

export async function sync(connection) {
  await await firstNCBITaxonomyImport(connection);
  await incrementalNCBITaxonomyImport(connection);
}
