import debugLibrary from '../../../../utils/Debug.js';

import { sortTaxonomies } from './sortTaxonomies.js';

const debug = debugLibrary('getTaxonomiesInfo');

/**
 * @description Get unique taxonomies from the aggregation process data
 * @param {*} data The data from aggregation process
 * @param {*} connection The connection to the database
 * @returns {Promise} An array containing unique taxonomies
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
      } catch (e) {
        if (connection) {
          debug.error(e.message, {
            collection: 'activesOrNaturals',
            connection,
            stack: e.stack,
          });
        }
      }
    }
    const sortedTaxonomies = sortTaxonomies(taxons);
    return sortedTaxonomies;
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
