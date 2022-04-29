import pkg from 'papaparse';
import Debug from '../../../../utils/Debug.js';

import { readFileSync } from 'fs';
const { parse } = pkg;

async function readNpassesLastFiles(
  lastFile,
  lastFileActivity,
  lastFileSpeciesProperties,
  lastFileSpeciesInfo,
  lastFileSpeciesPair,
  connection,
) {
  const debug = Debug('readNpassesLastFiles');
  try {
    const general = parse(readFileSync(lastFile, 'utf8'), {
      header: true,
    }).data;

    const activities = {};
    parse(readFileSync(lastFileActivity, 'utf8'), {
      header: true,
    }).data.forEach((entry) => {
      if (!activities[entry.np_id]) {
        activities[entry.np_id] = [];
      }
      activities[entry.np_id].push(entry);
    });
    const properties = {};
    parse(readFileSync(lastFileSpeciesProperties, 'utf8'), {
      header: true,
    }).data.forEach((entry) => (properties[entry.np_id] = entry));
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
    const speciesInfo = {};
    parse(readFileSync(lastFileSpeciesInfo, 'utf8'), {
      header: true,
    }).data.forEach((entry) => (speciesInfo[entry.org_id] = entry));

    return { general, activities, properties, speciesPair, speciesInfo };
  } catch (e) {
    const optionsDebug = { collection: 'npasses', connection };
    debug(e, optionsDebug);
  }
}
export default readNpassesLastFiles;
