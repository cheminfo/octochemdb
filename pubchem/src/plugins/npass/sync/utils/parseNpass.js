import OCL from 'openchemlib';
import Debug from 'debug';

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
    const finalActivity = [];
    if (activity !== undefined) {
      for (const info of activity) {
        finalActivity.push({
          type: info.activity_type,
          value: info.activity_value,
          unit: info.activity_units,
          assayOrganism: info.assay_organism,
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
    const taxonomy = [speciesInfo[orgID]];

    const finalTaxonomy = [];
    if (taxonomy !== undefined) {
      for (const info of taxonomy) {
        finalTaxonomy.push({
          kingdom: info?.kingdom_name,
          family: info?.family_name,
          genus: info?.genus_name,
          species: info?.org_name,
        });
      }
    }

    const result = {
      _id: item.np_id,
      data: {
        cid: item.pubchem_cid,
        ocl: {
          id: oclID.idCode,
          coordinates: oclID.coordinates,
          noStereoID: noStereoID,
        },
        taxonomy: finalTaxonomy,
        activities: finalActivity,
      },
    };
    if (Date.now() - start > 10000) {
      debug(`Processing: counter: ${counter} `);
      start = Date.now();
    }
    counter++;
    results.push(result);
  }
  return results;
}
