import { readFileSync } from 'fs';
import { join } from 'path';

import OCL from 'openchemlib';
import { parse } from 'papaparse';

export function parseNpass(dirPath) {
  //http://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_generalInfo.txt
  const general = parse(
    readFileSync(
      join(dirPath, 'NPASSv1.0_download_naturalProducts_generalInfo.txt'),
      'utf8',
    ),
    {
      header: true,
    },
  ).data;

  const activities = {};
  //http://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_activities.txt
  parse(
    readFileSync(
      join(dirPath, 'NPASSv1.0_download_naturalProducts_activities.txt'),
      'utf8',
    ),
    {
      header: true,
    },
  ).data.forEach((entry) => {
    if (!activities[entry.np_id]) {
      activities[entry.np_id] = [];
    }
    activities[entry.np_id].push(entry);
  });
  //http://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_properties.txt
  const properties = {};
  parse(
    readFileSync(
      join(dirPath, 'NPASSv1.0_download_naturalProducts_properties.txt'),
      'utf8',
    ),
    {
      header: true,
    },
  ).data.forEach((entry) => (properties[entry.np_id] = entry));
  //http://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_species_pair.txt
  const speciesPair = {};
  parse(
    readFileSync(
      join(dirPath, 'NPASSv1.0_download_naturalProducts_species_pair.txt'),
      'utf8',
    ),
    {
      header: true,
    },
  ).data.forEach((entry) => (speciesPair[entry.np_id] = entry.org_id));
  //http://bidd.group/NPASS/downloadFiles/NPASSv1.0_download_naturalProducts_speciesInfo.txt
  const speciesInfo = {};
  parse(
    readFileSync(
      join(dirPath, 'NPASSv1.0_download_naturalProducts_speciesInfo.txt'),
      'utf8',
    ),
    {
      header: true,
    },
  ).data.forEach((entry) => (speciesInfo[entry.org_id] = entry));

  const results = [];
  for (const item of general) {
    if (Object.keys(item).length > 1) {
      const property = properties[item.np_id];
      const activity = activities[item.np_id];
      const finalActivity = [];
      for (const info of activity) {
        finalActivity.push({
          activityType: info.activity_type,
          activityValue: info.activity_value,
          activityUnit: info.activity_units,
          assayOrganism: info.assay_organism,
          refIdType: info.ref_id_type,
          refId: info.ref_id,
        });
      }
      const smilesDb = property.canonical_smiles;
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
      const orgID = speciesPair[item.np_id];
      const taxonomy = speciesInfo[orgID];

      const finalTaxonomy = {
        organismName: taxonomy?.org_name,
        organismIdNCBI: taxonomy?.org_tax_id,
        tree: [
          taxonomy?.kingdom_name,
          '', //phylum but not present
          '', // class but not present
          taxonomy?.family_name,
          taxonomy?.genus_name,
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

  return results;
}
