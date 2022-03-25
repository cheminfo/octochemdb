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
      let oclID;
      let noStereoID;
      try {
        const oclMolecule = OCL.Molecule.fromSmiles(smilesDb);

        oclID = oclMolecule.getIDCodeAndCoordinates();

        oclMolecule.stripStereoInformation();
        noStereoID = oclMolecule.getIDCode();
      } catch (Class$S16) {
        continue;
      }
      const orgID = speciesPaired[id];
      const taxonomy = speciesInfo[orgID];
      const finalTaxonomy = {
        organismIdNCBI: taxonomy?.Species_Tax_ID,
        organismName: taxonomy?.Plant_Name,
        tree: [
          '',
          '',
          '',
          taxonomy?.Family_Name,
          taxonomy?.Genus_Name,
          taxonomy?.Species_Name,
        ],
      };
      const result = {
        _id: noStereoID,
        ocl: {
          id: oclID.idCode,
          coordinates: oclID.coordinates,
          noStereoID: noStereoID,
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
