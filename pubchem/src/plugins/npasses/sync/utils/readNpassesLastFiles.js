import { readFileSync } from 'fs';

import pkg from 'papaparse';

import Debug from '../../../../utils/Debug.js';

const { parse } = pkg;
/**
 * @description Reads the npasses files and returns the data
 * @param {string} lastFile - last molecules file available in the NPASS database
 * @param {string} lastFileActivity - last activities file available in the NPASS database
 * @param {string} lastFileSpeciesProperties - last species properties file available in the NPASS database
 * @param {string} lastFileSpeciesInfo - last species info file available in the NPASS database
 * @param {string} lastFileSpeciesPair - last species pair file available in the NPASS database
 * @param {*} connection - mongo connection
 * @returns {object} returns the data { general, activities, properties, speciesPair, speciesInfo }
 */
export default function readNpassesLastFiles(
  lastFile,
  lastFileActivity,
  lastFileSpeciesProperties,
  lastFileSpeciesInfo,
  lastFileSpeciesPair,
  connection,
) {
  const debug = Debug('readNpassesLastFiles');
  try {
    // read last file and get general data
    const general = parse(readFileSync(lastFile, 'utf8'), {
      header: true,
    }).data;
    // get activities data
    const activities = {};
    parse(readFileSync(lastFileActivity, 'utf8'), {
      header: true,
    }).data.forEach((entry) => {
      if (!activities[entry.np_id]) {
        activities[entry.np_id] = [];
      }
      activities[entry.np_id].push(entry);
    });
    // get properties data
    const properties = {};
    parse(readFileSync(lastFileSpeciesProperties, 'utf8'), {
      header: true,
    }).data.forEach((entry) => (properties[entry.np_id] = entry));
    // get species pair data
    const speciesPair = {};
    parse(readFileSync(lastFileSpeciesPair, 'utf8'), {
      header: true,
    }).data.forEach((entry) => {
      if (!speciesPair[entry.np_id] && entry.np_id !== undefined) {
        speciesPair[entry.np_id] = [];
      }
      if (entry.np_id !== undefined) {
        speciesPair[entry.np_id].push(entry.org_id);
      }
    });
    // get species info data
    const speciesInfo = {};
    parse(readFileSync(lastFileSpeciesInfo, 'utf8'), {
      header: true,
    }).data.forEach((entry) => (speciesInfo[entry.org_id] = entry));
    // return data
    return { general, activities, properties, speciesPair, speciesInfo };
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'npasses', connection });
    }
  }
}
