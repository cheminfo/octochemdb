import OCL from 'openchemlib';

export function parseCMAUP(general, activities, speciesPair, speciesInfo) {
  const results = [];
  const speciesPaired = {};

  for (const pair of speciesPair) {
    speciesPaired[pair[1]] = pair[0];
  }

  for (const item of general) {
    if (Object.keys(item.Ingredient_ID).length > 0) {
      const id = item.Ingredient_ID;
      const activity = activities[id];
      const finalActivity = [];
      if (activity !== undefined) {
        for (const info of activity) {
          finalActivity.push({
            activityType: info?.Activity_Type,
            activityValue: info?.Activity_value,
            activityUnit: info?.Activity_Unit,
            refIdType: info?.Reference_ID_Type,
            refId: info?.Reference_ID,
          });
        }
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
      const orgID = speciesPaired[id];
      const taxonomy = speciesInfo[orgID];
      const finalTaxonomy = {
        organismIdNCBI: taxonomy?.Species_Tax_ID,
        organismName: taxonomy?.Plant_Name,
        tree: [
          [],
          [],
          [],
          taxonomy?.Family_Name,
          taxonomy?.Genus_Name,
          taxonomy?.Species_Name,
        ],
      };
      const result = {
        _id: noStereoID2[0],
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
