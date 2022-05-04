import Debug from '../../../../utils/Debug.js';
import { getTaxonomiesForLotuses } from './getTaxonomiesForLotuses.js';
import { getTaxonomiesForCoconuts } from './getTaxonomiesForCoconuts.js';
import { getTaxonomiesForCmaupsAndNpasses } from './getTaxonomiesForCmaupsAndNpasses.js';
import { getTaxonomiesForNpAtlases } from './getTaxonomiesForNpAtlases.js';
const debug = Debug('standardizeTaxonomies');

export async function standardizeTaxonomies(
  data,
  synonims,
  taxonomiesCollection,
) {
  let newData = [];
  let counter = 0;
  for (let entry of data) {
    if (counter > 1000) {
      continue;
    }
    if (entry.collection === 'lotuses') {
      let resultLotuses = await getTaxonomiesForLotuses(
        entry,
        taxonomiesCollection,
        synonims,
      );

      entry = resultLotuses;
      if (entry?.data?.taxonomies) {
        counter += entry?.data?.taxonomies.length;
      }
    }

    if (entry.collection === 'cmaups') {
      let resultsCmaups = await getTaxonomiesForCmaupsAndNpasses(
        entry,
        taxonomiesCollection,
      );
      entry = resultsCmaups;
      if (entry?.data?.taxonomies) {
        counter += entry?.data?.taxonomies.length;
      }
    }
    if (entry.collection === 'npasses') {
      let resultsNpasses = await getTaxonomiesForCmaupsAndNpasses(
        entry,
        taxonomiesCollection,
      );
      entry = resultsNpasses;
      if (entry?.data?.taxonomies) {
        counter += entry?.data?.taxonomies.length;
      }
    }
    if (entry.collection === 'npAtlases') {
      let resultsNpAtlases = await getTaxonomiesForNpAtlases(
        entry,
        taxonomiesCollection,
      );
      entry = resultsNpAtlases;
      if (entry?.data?.taxonomies) {
        counter += entry?.data?.taxonomies.length;
      }
    }
    if (entry.collection === 'coconuts') {
      let resultsCoconuts = await getTaxonomiesForCoconuts(
        entry,
        taxonomiesCollection,
      );

      entry = resultsCoconuts;
      if (entry?.data?.taxonomies) {
        counter += entry?.data?.taxonomies.length;
      }
    }
    newData.push(entry);
  }
  return newData;
}
