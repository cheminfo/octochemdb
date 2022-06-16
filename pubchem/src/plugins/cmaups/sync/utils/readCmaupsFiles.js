import { readFileSync } from 'fs';

import pkg from 'papaparse';

import Debug from '../../../../utils/Debug.js';

const { parse } = pkg;
const debug = Debug('readCmaupsFiles');

/**
 * @description read the cmaups files and return the data
 * @param {*} lastFileGeneral the last file "general" available from source
 * @param {*} lastFileActivity the last file "activities" available from source
 * @param {*} lastFileSpeciesAssociation the last file "species association" available from source
 * @param {*} lastFileSpeciesInfo the last file "species info" available from source
 * @param {*} connection the connection to the database
 * @returns {Object} general, activities, speciesPair, speciesInfo
 */
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
    // If error is catch, debug it on telegram
    if (connection) {
      debug(e, { collection: 'bioassays', connection });
    }
  }
}
