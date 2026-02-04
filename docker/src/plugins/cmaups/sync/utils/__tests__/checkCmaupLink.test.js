import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { checkCmaupLink } from '../checkCmaupLink.js';

dotenv.config();
test('checkCmaupLink', async () => {
  const previousLinks = [
    'https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Ingredients_All.txt',
    'https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Ingredient_Target_Associations_ActivityValues_References.txt',
    'https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Plant_Ingredient_Associations_onlyActiveIngredients.txt',
    'https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Plants.txt',
    'https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Targets.txt',
  ];
  const connection = new OctoChemConnection();
  const result = await checkCmaupLink(previousLinks, connection);
  expect(result).toMatchInlineSnapshot(`
    [
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Plants.txt",
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Ingredients_All.txt",
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Ingredients_onlyActive.txt",
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Targets.txt",
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Plant_Ingredient_Associations_allIngredients.txt",
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Plant_Ingredient_Associations_onlyActiveIngredients.txt",
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Ingredient_Target_Associations_ActivityValues_References.txt",
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Human_Oral_Bioavailability_information_of_Ingredients_All.txt",
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Plant_molecular_targets_overlapping_with_DEGs.txt",
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Transcriptomic_profiling_of_74_diseases.rar",
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Plant_Clinical_Trials_Associations.txt",
      "https://bidd.group/CMAUP/downloadFiles/CMAUPv2.0_download_Plant_Human_Disease_Associations.txt",
      "https://bidd.group/CMAUP/downloadFiles/Download_Readme.txt",
      "https://bidd.group/CMAUP/downloadFiles_2018/CMAUPv1.0_download_Plants.txt",
      "https://bidd.group/CMAUP/downloadFiles_2018/CMAUPv1.0_download_Ingredients_All.txt",
      "https://bidd.group/CMAUP/downloadFiles_2018/CMAUPv1.0_download_Ingredients_onlyActive.txt",
      "https://bidd.group/CMAUP/downloadFiles_2018/CMAUPv1.0_download_Targets.txt",
      "https://bidd.group/CMAUP/downloadFiles_2018/CMAUPv1.0_download_Plant_Ingredient_Associations_allIngredients.txt",
      "https://bidd.group/CMAUP/downloadFiles_2018/CMAUPv1.0_download_Plant_Ingredient_Associations_onlyActiveIngredients.txt",
      "https://bidd.group/CMAUP/downloadFiles_2018/CMAUPv1.0_download_Ingredient_Target_Associations_ActivityValues_References.txt",
      "https://bidd.group/CMAUP/downloadFiles_2018/Download_Readme.txt",
    ]
  `);

  await connection.close();
});
