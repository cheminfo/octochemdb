import OCL from 'openchemlib';

import Debug from '../../../../utils/Debug.js';

const debug = Debug('parseNpass');
export function parseNpass(
  general,
  activities,
  properties,
  speciesPair,
  speciesInfo,
) {
  const results = [];
  let counter = 0;
  let start = Date.now();
  for (const item of general) {
    const property = properties[item.np_id];
    const activity = activities[item.np_id];
    const finalActivities = [];
    if (activity !== undefined) {
      for (const info of activity) {
        let originalActivites = {};
        if (info.activity_type) originalActivites.type = info.activity_type;
        if (info.activity_value) originalActivites.value = info.activity_value;
        if (info.activity_units) originalActivites.unit = info.activity_units;
        if (info.assay_organism) {
          originalActivites.assayOrganism = info.assay_organism;
        }
        finalActivities.push(originalActivites);
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
    const taxonomies = speciesInfo[orgID];

    const finalTaxonomies = [];
    if (taxonomies !== undefined) {
      let originalTaxonomies = {};
      if (taxonomies?.kingdom_name) {
        originalTaxonomies.kingdom = taxonomies?.kingdom_name;
      }
      if (taxonomies?.family_name) {
        originalTaxonomies.family = taxonomies?.family_name;
      }
      if (taxonomies?.genus_name) {
        originalTaxonomies.genus = taxonomies?.genus_name;
      }
      if (taxonomies?.org_name) {
        originalTaxonomies.species = taxonomies?.org_name;
      }
      finalTaxonomies.push(originalTaxonomies);
    }

    const result = {
      _id: item.np_id,
      data: {
        ocl: {
          id: oclID.idCode,
          coordinates: oclID.coordinates,
          noStereoID: noStereoID,
        },
      },
    };
    if (item.pubchem_cid) result.data.cid = item.pubchem_cid;
    if (finalTaxonomies.length !== 0) result.data.taxonomies = finalTaxonomies;
    if (finalActivities.length !== 0) result.data.activities = finalActivities;
    if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
      debug(`Processing: counter: ${counter} `);
      start = Date.now();
    }
    counter++;
    results.push(result);
  }
  return results;
}
