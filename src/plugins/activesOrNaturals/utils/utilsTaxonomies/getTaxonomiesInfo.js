import debugLibrary from '../../../../utils/Debug.js';

import { sortTaxonomies } from './sortTaxonomies.js';

const debug = debugLibrary('getTaxonomiesInfo');

/**
 * Collect and deduplicate taxonomies from aggregation data, then sort them.
 * @param data - documents from the aggregation pipeline
 * @param connection
 * @returns sorted unique taxonomies
 */
export default async function getTaxonomiesInfo(data, connection) {
  try {
    let taxons = [];
    for (const entry of data) {
      if (entry.data?.taxonomies) {
        for (let taxonomy of entry.data.taxonomies) {
          taxons.push(taxonomy);
        }
      }
    }
    if (taxons.length > 0) {
      try {
        taxons = taxons.filter(
          (elem, index, self) =>
            self.findIndex((taxonomy) => {
              return taxonomy?.species === elem.species;
            }) === index,
        );
      } catch (/** @type {any} */ error) {
        if (connection) {
          debug.error(error.message, {
            collection: 'activesOrNaturals',
            connection,
            stack: error.stack,
          });
        }
      }
    }
    const sortedTaxonomies = sortTaxonomies(taxons);
    return sortedTaxonomies;
  } catch (/** @type {any} */ error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: error.stack,
      });
    }
  }
}
