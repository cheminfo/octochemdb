import pkg from 'papaparse';

import { readFileSync } from 'fs';
const { parse } = pkg;

async function readNpassesLastFiles(
  lastFile,
  lastFileActivity,
  lastFileSpeciesProperties,
  lastFileSpeciesInfo,
  lastFileSpeciesPair,
) {
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
  }).data.forEach((entry) => (speciesPair[entry.np_id] = entry.org_id));
  const speciesInfo = {};
  parse(readFileSync(lastFileSpeciesInfo, 'utf8'), {
    header: true,
  }).data.forEach((entry) => (speciesInfo[entry.org_id] = entry));

  return { general, activities, properties, speciesPair, speciesInfo };
}
export default readNpassesLastFiles;
