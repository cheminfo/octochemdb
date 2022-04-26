import OCL from 'openchemlib';
import Debug from '../../../../utils/Debug.js';
export async function* parseNpasses(
  general,
  activities,
  properties,
  speciesPair,
  speciesInfo,
  parseSkip,
  connection,
) {
  const debug = Debug('parseNpasses');
  try {
    let skipping = true;
    for await (const item of general) {
      if (skipping && parseSkip !== undefined) {
        if (parseSkip === item.np_id) {
          skipping = false;
          debug(`Skipping compound till:${item.np_id}`);
        }
        continue;
      }
      try {
        const property = properties[item.np_id];
        const activity = activities[item.np_id];
        const finalActivities = [];
        if (activity !== undefined) {
          for (const info of activity) {
            let originalActivites = {};
            if (info.activity_type) {
              originalActivites.activityType = info.activity_type;
            }
            if (info.activity_value) {
              originalActivites.activityValue = info.activity_value;
            }
            if (info.activity_units) {
              originalActivites.activityUnit = info.activity_units;
            }
            if (info.assay_tax_id) {
              originalActivites.target_id = info.assay_tax_id;
            }
            if (info.assay_organism) {
              originalActivites.assayOrganism = info.assay_organism;
            }
            if (info.ref_id) {
              originalActivites.refId = info.ref_id;
            }
            if (info.ref_id_type) {
              originalActivites.refIdType = info.ref_id_type;
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
        } catch (e) {
          continue;
        }
        const orgID = speciesPair[item.np_id];
        const taxonomies = speciesInfo[orgID];

        const finalTaxonomies = [];
        if (taxonomies !== undefined) {
          let taxons = {};
          if (taxonomies?.kingdom_name) {
            taxons.kingdom = taxonomies?.kingdom_name;
          }
          if (taxonomies?.kingdom_tax_id) {
            taxons.kingdomID = taxonomies?.kingdom_tax_id;
          }
          if (taxonomies?.family_name) {
            taxons.family = taxonomies?.family_name;
          }
          if (taxonomies?.family_tax_id) {
            taxons.familyID = taxonomies?.family_tax_id;
          }
          if (taxonomies?.genus_name) {
            taxons.genus = taxonomies?.genus_name;
          }
          if (taxonomies?.genus_tax_id) {
            taxons.genusID = taxonomies?.genus_tax_id;
          }
          if (taxonomies?.org_name) {
            taxons.species = taxonomies?.org_name;
          }
          if (taxonomies?.species_tax_id) {
            taxons.speciesID = taxonomies?.species_tax_id;
          }
          if (taxons !== {}) {
            finalTaxonomies.push(taxons);
          }
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
        if (finalTaxonomies.length !== 0)
          result.data.taxonomies = finalTaxonomies;
        if (finalActivities.length !== 0)
          result.data.activities = finalActivities;

        yield result;
      } catch (e) {
        continue;
      }
    }
  } catch (e) {
    const optionsDebug = { collection: 'npasses', connection };
    debug(e, optionsDebug);
  }
}
