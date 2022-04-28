import Debug from '../../../utils/Debug.js';
import { getTaxonomiesForLotuses } from './getTaxonomiesForLotuses.js';
import { searchTaxonomies } from './searchTaxonomies.js';
import { getTaxonomiesForCoconuts } from '../utils/getTaxonomiesForCoconuts.js';
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
    newData.push(entry);
  }
  return newData;
}
