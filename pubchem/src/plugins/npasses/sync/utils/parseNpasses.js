import OCL from 'openchemlib';

import Debug from '../../../../utils/Debug.js';

const debug = Debug('parseNpasses');

export async function* parseNpasses(
  general,
  activities,
  properties,
  speciesPair,
  speciesInfo,
  connection,
) {
  try {
    for await (const item of general) {
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
            if (info.assay_tax_id && info.assay_tax_id !== '0') {
              originalActivites.targetId = info.assay_tax_id;
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
          if (connection) {
            debug(e, { collection: 'npasses', connection });
          }
          continue;
        }
        const orgIDs = speciesPair[item.np_id];

        const taxonomies = [];
        if (orgIDs) {
          if (orgIDs.length > 0) {
            orgIDs.forEach((idOrg) => {
              if (speciesInfo[idOrg]) {
                taxonomies.push(speciesInfo[idOrg]);
              }
            });
          }
        }

        const finalTaxonomies = [];
        if (taxonomies.length > 0) {
          for (const infos of taxonomies) {
            let taxons = {};
            if (infos?.kingdom_name && infos?.kingdom_name !== 'NA') {
              taxons.kingdom = infos?.kingdom_name;
            }
            if (infos?.kingdom_tax_id && infos?.kingdom_tax_id !== 'NA') {
              taxons.kingdomID = infos?.kingdom_tax_id;
            }
            if (infos?.family_name && infos?.family_name !== 'NA') {
              taxons.family = infos?.family_name;
            }
            if (infos?.family_tax_id && infos?.family_tax_id !== 'NA') {
              taxons.familyID = infos?.family_tax_id;
            }
            if (infos?.genus_name && infos?.genus_name !== 'NA') {
              taxons.genus = infos?.genus_name;
            }
            if (infos?.genus_tax_id && infos?.genus_tax_id !== 'NA') {
              taxons.genusID = infos?.genus_tax_id;
            }
            if (infos?.org_name && infos?.org_name !== 'NA') {
              taxons.species = infos?.org_name;
            }
            if (infos?.species_tax_id && infos?.species_tax_id !== 'NA') {
              taxons.speciesID = infos?.species_tax_id;
            }
            if (taxons !== {}) {
              finalTaxonomies.push(taxons);
            }
          }
        }

        const result = {
          _id: item.np_id,
          data: {
            ocl: {
              id: oclID.idCode,
              noStereoID: noStereoID,
            },
          },
        };
        if (item.pubchem_cid) result.data.cid = item.pubchem_cid;
        if (finalTaxonomies.length !== 0) {
          result.data.taxonomies = finalTaxonomies;
        }
        if (finalActivities.length !== 0) {
          result.data.activities = finalActivities;
        }

        yield result;
      } catch (e) {
        if (connection) {
          debug(e, { collection: 'npasses', connection });
        }
        continue;
      }
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'npasses', connection });
    }
  }
}
