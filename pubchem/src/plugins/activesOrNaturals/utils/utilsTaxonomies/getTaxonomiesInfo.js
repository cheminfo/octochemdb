import Debug from '../../../../utils/Debug.js';

const debug = Debug('getTaxonomiesInfo');

/**
 * @description Get unique taxonomies from the aggregation process data
 * @param {*} data The data from aggregation process
 * @param {*} connection The connection to the database
 * @returns {Promise<Array>} An array containing unique taxonomies
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
          debug(e.message, {
            collection: 'activesOrNaturals',
            connection,
            stack: e.stack,
          });
        }
      }
    }

    return taxons;
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
