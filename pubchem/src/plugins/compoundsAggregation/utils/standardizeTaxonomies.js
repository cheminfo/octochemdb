import Debug from '../../../utils/Debug.js';
import { getTaxonomiesForLotuses } from './getTaxonomiesForLotuses.js';
import { getTaxonomiesForCoconuts } from '../utils/getTaxonomiesForCoconuts.js';
import { getTaxonomiesForCmaupsAndNpasses } from '../utils/getTaxonomiesForCmaupsAndNpasses.js';
import { getTaxonomiesForNpAtlases } from '../utils/getTaxonomiesForNpAtlases.js';
const debug = Debug('standardizeTaxonomies');

export async function standardizeTaxonomies(data, connection) {
  let newData = [];

  const taxonomiesCollection = await connection.getCollection('taxonomies');
  for (let entry of data) {
    if (entry.collection === 'lotuses') {
      let resultLotuses = await getTaxonomiesForLotuses(
        entry,
        taxonomiesCollection,
      );
      entry = resultLotuses;
    }
    if (entry.collection === 'coconuts') {
      let resultsCoconuts = await getTaxonomiesForCoconuts(
        entry,
        taxonomiesCollection,
      );

      entry = resultsCoconuts;
    }

    if (entry.collection === 'cmaups') {
      let resultsCmaups = await getTaxonomiesForCmaupsAndNpasses(
        entry,
        taxonomiesCollection,
      );
      entry = resultsCmaups;
    }
    if (entry.collection === 'npasses') {
      let resultsNpasses = await getTaxonomiesForCmaupsAndNpasses(
        entry,
        taxonomiesCollection,
      );
      entry = resultsNpasses;
    }
    if (entry.collection === 'npAtlases') {
      let resultsNpAtlases = await getTaxonomiesForNpAtlases(
        entry,
        taxonomiesCollection,
      );
      entry = resultsNpAtlases;
    }
    newData.push(entry);
  }
  return newData;
}
