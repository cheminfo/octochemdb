import { getTaxonomiesForCmaupsAndNpasses } from './getTaxonomiesForCmaupsAndNpasses.js';
import { getTaxonomiesForCoconuts } from './getTaxonomiesForCoconuts.js';
import { getTaxonomiesForLotuses } from './getTaxonomiesForLotuses.js';
import { getTaxonomiesForNpAtlases } from './getTaxonomiesForNpAtlases.js';
import { getTaxonomiesSubstances } from './getTaxonomiesSubstances.js';

export async function standardizeTaxonomies(
  data,
  synonyms,
  taxonomiesCollection,
) {
  let newData = [];
  let counter = 0;
  for (let entry of data) {
    if (counter > 1000) {
      continue;
    }
    switch (entry.collection) {
      case 'substances': {
        let resultSubstances = await getTaxonomiesSubstances(
          entry,
          taxonomiesCollection,
          synonyms,
        );

        entry = resultSubstances;
        if (entry?.data?.taxonomies) {
          counter += entry?.data?.taxonomies.length;
        }
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
        let resultsNpasses = await getTaxonomiesForCmaupsAndNpasses(
          entry,
          taxonomiesCollection,
        );
        entry = resultsNpasses;
        if (entry?.data?.taxonomies) {
          counter += entry?.data?.taxonomies.length;
        }
        break;
      }
      case 'npAtlases': {
        let resultsNpAtlases = await getTaxonomiesForNpAtlases(
          entry,
          taxonomiesCollection,
        );
        entry = resultsNpAtlases;
        if (entry?.data?.taxonomies) {
          counter += entry?.data?.taxonomies.length;
        }
        break;
      }
      case 'coconuts': {
        let resultsCoconuts = await getTaxonomiesForCoconuts(
          entry,
          taxonomiesCollection,
        );

        entry = resultsCoconuts;
        if (entry?.data?.taxonomies) {
          counter += entry?.data?.taxonomies.length;
        }
        break;
      }
      case 'bioassays': {
        entry = entry;
        break;
      }
      default:
        throw new Error(`Unknow collectioin: ${entry.collection}`);
    }

    newData.push(entry);
  }
  return newData;
}
