import { getTaxonomiesForCmaupsAndNpasses } from './getTaxonomiesForCmaupsAndNpasses.js';
import { getTaxonomiesForCoconuts } from './getTaxonomiesForCoconuts.js';
import { getTaxonomiesForLotuses } from './getTaxonomiesForLotuses.js';
import { getTaxonomiesForNpAtlases } from './getTaxonomiesForNpAtlases.js';

/**
 * @description Standardize taxonomies to NCBI format using a set of function based on the collection source (cmaups, npasses, coconuts, lotuses, npAtlases)
 * @param {Object} data The data from aggregation process
 * @param {Object} synonyms The new-old IDs mapping
 * @param {*} taxonomiesCollection The taxonomies collection
 * @returns {Promise<Array>} The data from aggregation process with standardized taxonomies
 */
export async function standardizeTaxonomies(
  data,
  synonyms,
  taxonomiesCollection,
) {
  let newData = [];
  let counter = 0;
  for (let entry of data) {
    if (counter > 1000) {
      break;
    }
    switch (entry.collection) {
      case 'naturalSubstances': {
        break;
      }
      case 'bioassays': {
        break;
      }
      case 'lotuses': {
        let resultLotuses = await getTaxonomiesForLotuses(
          entry,
          taxonomiesCollection,
          synonyms,
        );

        entry = resultLotuses;
        if (entry?.data?.taxonomies) {
          counter += entry?.data?.taxonomies.length;
        }
        break;
      }
      case 'cmaups': {
        let resultsCmaups = await getTaxonomiesForCmaupsAndNpasses(
          entry,
          taxonomiesCollection,
        );
        entry = resultsCmaups;
        if (entry?.data?.taxonomies) {
          counter += entry?.data?.taxonomies.length;
        }
        break;
      }
      case 'npasses': {
        entry = await getTaxonomiesForCmaupsAndNpasses(
          entry,
          taxonomiesCollection,
        );

        if (entry?.data?.taxonomies) {
          counter += entry?.data?.taxonomies.length;
        }
        break;
      }
      case 'npAtlases': {
        entry = await getTaxonomiesForNpAtlases(entry, taxonomiesCollection);

        if (entry?.data?.taxonomies) {
          counter += entry?.data?.taxonomies.length;
        }
        break;
      }
      case 'coconuts': {
        entry = await getTaxonomiesForCoconuts(entry, taxonomiesCollection);

        if (entry?.data?.taxonomies) {
          counter += entry?.data?.taxonomies.length;
        }
        break;
      }

      default:
        throw new Error(`Unknow collectioin: ${entry.collection}`);
    }

    newData.push(entry);
  }
  return newData;
}
