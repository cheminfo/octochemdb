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
  return results;
}
