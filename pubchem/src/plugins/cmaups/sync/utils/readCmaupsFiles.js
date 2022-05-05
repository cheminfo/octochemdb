import { readFileSync } from 'fs';

import pkg from 'papaparse';

import Debug from '../../../../utils/Debug.js';

const { parse } = pkg;

const debug = Debug('readCmaupsFiles');

async function readCmaupsFiles(
  lastFile,
  lastFileActivity,
  lastFileSpeciesAssociation,
  lastFileSpeciesInfo,
  connection,
) {
  try {
    const general = parse(readFileSync(lastFile, 'utf8'), {
      header: true,
    }).data;
    const activities = {};
    parse(readFileSync(lastFileActivity, 'utf8'), {
      header: true,
    }).data.forEach((entry) => {
      if (!activities[entry.Ingredient_ID]) {
        activities[entry.Ingredient_ID] = [];
      }
      activities[entry.Ingredient_ID].push(entry);
    });

    const speciesPair = parse(
      readFileSync(lastFileSpeciesAssociation, 'utf8'),
      {
        header: false,
      },
    ).data;

    const speciesInfo = {};
    parse(readFileSync(lastFileSpeciesInfo, 'utf8'), {
      header: true,
    }).data.forEach((entry) => (speciesInfo[entry.Plant_ID] = entry));
    return { general, activities, speciesPair, speciesInfo };
  } catch (e) {
    const optionsDebug = { collection: 'cmaups', connection };
    debug(e, optionsDebug);
  }
}

export default readCmaupsFiles;
