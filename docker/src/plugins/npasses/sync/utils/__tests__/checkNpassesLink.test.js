import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { checkNpassesLink } from '../checkNpassesLink.js';

dotenv.config();
test('checkNpassesLink', async () => {
  const previousLinks = [
    'https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_generalinfo.txt',
    'https://bidd.group/NPASS/downloadFiles/NPASS3.0_activities.txt',
    'https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_structure.txt',
    'https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_species_pair.txt',
    'https://bidd.group/NPASS/downloadFiles/NPASS3.0_species_info.txt',
    'https://bidd.group/NPASS/downloadFiles/NPASS3.0_target.txt',
  ];
  const connection = new OctoChemConnection();
  const result = await checkNpassesLink(previousLinks, connection);
  expect(result).toMatchInlineSnapshot(`
    [
      "https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_generalinfo.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_structure.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASS3.0_activities.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASS3.0_naturalproducts_species_pair.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASS3.0_target.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASS3.0_species_info.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASS3.0_toxicity.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASS3.0_Symbiont.tsv",
      "https://bidd.group/NPASS/downloadFiles/NPASS3.0_Elicitation.tsv",
      "https://bidd.group/NPASS/downloadFiles/NPASS3.0_Coculture.tsv",
      "https://bidd.group/NPASS/downloadFiles/NPASS3.0_Engineer.tsv",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_generalInfo.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_properties.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_structure.rar",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_structure.zip",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_activities.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_species_pair.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_targetInfo.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_speciesInfo.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_speciesInfo.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_speciesInfo.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_speciesInfo.txt",
      "https://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_speciesInfo.txt",
    ]
  `);
  if (connection) {
    await connection.close();
  }
});
