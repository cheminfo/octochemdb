import pkg from 'papaparse';

import { readFileSync } from 'fs';
const { parse } = pkg;

async function readCmaupsFiles(
  lastFile,
  lastFileActivity,
  lastFileSpeciesAssociation,
  lastFileSpeciesInfo,
) {
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

  const speciesPair = parse(readFileSync(lastFileSpeciesAssociation, 'utf8'), {
    header: false,
  }).data;

  const speciesInfo = {};
  parse(readFileSync(lastFileSpeciesInfo, 'utf8'), {
    header: true,
  }).data.forEach((entry) => (speciesInfo[entry.Plant_ID] = entry));
  return { general, activities, speciesPair, speciesInfo };
}
export default readCmaupsFiles;
