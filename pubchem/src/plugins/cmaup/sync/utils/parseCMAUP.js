import { readFileSync } from 'fs';
import { join } from 'path';

import OCL from 'openchemlib';
import { parse } from 'papaparse';

export function parseCMAUP(dirPath) {
  //http://bidd.group/CMAUP/downloadFiles/CMAUPv1.0_download_Ingredients_onlyActive.txt
  const general = parse(
    readFileSync(
      join(dirPath, 'CMAUPv1.0_download_Ingredients_onlyActive.txt'),
      'utf8',
    ),
    {
      header: true,
    },
  ).data;
  const activities = {};
  //http://bidd.group/CMAUP/downloadFiles/CMAUPv1.0_download_Ingredient_Target_Associations_ActivityValues_References.txt
  parse(
    readFileSync(
      join(
        dirPath,
        'CMAUPv1.0_download_Ingredient_Target_Associations_ActivityValues_References.txt',
      ),
      'utf8',
    ),
    {
      header: true,
    },
  ).data.forEach((entry) => {
    if (!activities[entry.Ingredient_ID]) {
      activities[entry.Ingredient_ID] = [];
    }
    activities[entry.Ingredient_ID].push(entry);
  });
  //http://bidd.group/CMAUP/downloadFiles/CMAUPv1.0_download_Plant_Ingredient_Associations_onlyActiveIngredients.txt
  const speciesPair = parse(
    readFileSync(
      join(
        dirPath,
        'CMAUPv1.0_download_Plant_Ingredient_Associations_onlyActiveIngredients.txt',
      ),
      'utf8',
    ),
    {
      header: false,
    },
  ).data;
  //http://bidd.group/CMAUP/downloadFiles/CMAUPv1.0_download_Plants.txt
  const speciesInfo = {};
  parse(readFileSync(join(dirPath, 'CMAUPv1.0_download_Plants.txt'), 'utf8'), {
    header: true,
  }).data.forEach((entry) => (speciesInfo[entry.Plant_ID] = entry));
  const results = [];
  const speciesPaired = {};

  for (const pair of speciesPair) {
    speciesPaired[pair[0].split('\t')[1]] = pair[0].split('\t')[0];
  }

  for (const item of general) {
    if (Object.keys(item.Ingredient_ID).length > 0) {
      const id = item.Ingredient_ID;
      const activity = activities[id];

      if (activity !== undefined) {
        const finalActivity = [];
        for (const info of activity) {
          finalActivity.push({
            activityType: info.Activity_Type,
            activityValue: info.Activity_value,
            activityUnit: info.Activity_Unit,
            refIdType: info.Reference_ID_Type,
            refId: info.Reference_ID,
          });
        }
        const smilesDb = item.canonical_smiles;
        const oclID2 = [];
        const noStereoID2 = [];
        try {
          const oclMolecule = OCL.Molecule.fromSmiles(smilesDb);

          const oclID = oclMolecule.getIDCodeAndCoordinates();
          oclID2.push(oclID);
          oclMolecule.stripStereoInformation();
          const noStereoID = oclMolecule.getIDCode();
          noStereoID2.push(noStereoID);
        } catch (Class$S16) {
          continue;
        }
        const orgID = speciesPaired[item.Ingredient_ID];

        const taxonomy = speciesInfo[orgID];
        const finalTaxonomy = {
          organismIdNCBI: taxonomy.Species_Tax_ID,
          organismName: taxonomy.Plant_Name,
          tree: [
            [],
            [],
            [],
            taxonomy.Family_Name,
            taxonomy.Genus_Name,
            taxonomy.Species_Name,
          ],
        };
        const result = {
          ocl: {
            id: oclID2[0].idCode,
            coordinates: oclID2[0].coordinates,
            noStereoID: noStereoID2[0],
            pubChemCID: item.pubchem_cid,
          },
          origin: {
            activities: finalActivity,
            taxonomy: finalTaxonomy,
          },
        };

        results.push(result);
      }
    }
  }

  return results;
}
