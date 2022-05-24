import { readFileSync } from 'fs';
import pkg from 'papaparse';
import Debug from '../../../../utils/Debug.js';

const { parse } = pkg;
const debug = Debug('readCmaupsFiles');

export default function readCmaupsFiles(
  lastFileGeneral,
  lastFileActivity,
  lastFileSpeciesAssociation,
  lastFileSpeciesInfo,
  connection,
) {
  try {
    // Read file containing molecule general data
    const general = parse(readFileSync(lastFileGeneral, 'utf8'), {
      header: true,
    }).data;
    // Read activities file
    const activities = {};
    parse(readFileSync(lastFileActivity, 'utf8'), {
      header: true,
    }).data.forEach((entry) => {
      if (!activities[entry.Ingredient_ID]) {
        activities[entry.Ingredient_ID] = [];
      }
      activities[entry.Ingredient_ID].push(entry);
    });
    // Read species association file
    const speciesPair = parse(
      readFileSync(lastFileSpeciesAssociation, 'utf8'),
      {
        header: false,
      },
    ).data;
    // Read species info file
    const speciesInfo = {};
    parse(readFileSync(lastFileSpeciesInfo, 'utf8'), {
      header: true,
    }).data.forEach((entry) => (speciesInfo[entry.Plant_ID] = entry));

    return { general, activities, speciesPair, speciesInfo };
  } catch (e) {
    // If error is chatched, debug it on telegram
    const optionsDebug = { collection: 'cmaups', connection };
    debug(e, optionsDebug);
  }
}
