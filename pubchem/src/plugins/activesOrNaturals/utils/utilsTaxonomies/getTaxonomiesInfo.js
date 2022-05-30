import Debug from '../../../../utils/Debug.js';

import { getTaxonomiesSubstances } from './getTaxonomiesSubstances.js';
import { taxonomySynonyms } from './taxonomySynonyms.js';

const debug = Debug('getTaxonomiesInfo');

export default async function getTaxonomiesInfo(data, connection) {
  try {
    let taxons = [];
    for (const entry of data) {
      // IT'S JUST TO AVOID REIMPORTATION OF SUBSTANCES, WHEN PROJECT GOES IN PROD THIS LINES SHOULD BE REMOVED
      if (entry.collection === 'substances') {
        if (entry.data.taxonomyIDs) {
          const synonyms = await taxonomySynonyms();
          const collectionTaxonomies = await connection.getCollection(
            'taxonomies',
          );
          let taxonomies = getTaxonomiesSubstances(
            entry,
            collectionTaxonomies,
            synonyms,
          );
          entry.data.taxonomies = taxonomies;
        }
      }
      // ***************************************************************************************************
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
        const optionsDebug = { collection: 'activesOrNaturals', connection };
        debug(e, optionsDebug);
      }
    }

    return taxons;
  } catch (e) {
    const optionsDebug = { collection: 'activesOrNaturals', connection };
    debug(e, optionsDebug);
  }
}
