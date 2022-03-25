import OCL from 'openchemlib';

export function parseNpass(
  general,
  activities,
  properties,
  speciesPair,
  speciesInfo,
) {
  const results = [];
  for (const item of general) {
    //if (Object.keys(item).length > 0) {
    const property = properties[item.np_id];
    const activity = activities[item.np_id];
    const finalActivity = [];
    if (activity !== undefined) {
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
    }
    const smilesDb = property.canonical_smiles;
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
    const orgID = speciesPair[item.np_id];
    const taxonomy = speciesInfo[orgID];

    const finalTaxonomy = {
      kingdom: taxonomy?.kingdom_name,
      family: taxonomy?.family_name,
      genus: taxonomy?.genus_name,
      species: taxonomy?.org_name,
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
        taxonomy: finalTaxonomy,
      },
      activities: finalActivity,
    };
    results.push(result);
  }
  return results;
}
