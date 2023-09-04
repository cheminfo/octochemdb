import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

/**
 * @description parse all npasses files and returns the data to be imported
 * @param {object} general - general data
 * @param {object} activities - activities data
 * @param {object} properties - properties data
 * @param {object} speciesPair - species pair data
 * @param {object} speciesInfo - species info data
 * @param {*} connection - mongo connection
 * @returns {*} returns the data to be imported
 */
export async function* parseNpasses(
  general,
  activities,
  properties,
  speciesPair,
  speciesInfo,
  targetInfo,
  connection,
) {
  const debug = debugLibrary('parseNpasses');
  try {
    // for each molecule in general data
    for await (const item of general) {
      // get properties and activities data
      const property = properties[item.np_id];
      // get ocl molecule and noStereoID
      if (property?.SMILES === undefined) {
        continue;
      }

      const smilesDb = property.SMILES;
      const oclMolecule = OCL.Molecule.fromSmiles(smilesDb);
      const ocl = await getNoStereosFromCache(
        oclMolecule,
        connection,
        'npasses',
      );
      const activity = activities[item.np_id];
      const finalActivities = [];
      if (activity !== undefined) {
        // parse activities data
        for (const info of activity) {
          // check if field is defined before adding it to the object
          let targetInfoActivity = targetInfo[info.target_id];

          let originalActivites = {
            assayTissue:
              info.assay_tissue !== 'n.a.' ? info.assay_tissue : null,
            assayCellType:
              info.assay_cell_type !== 'n.a.' ? info.assay_cell_type : null,
            assayStrain:
              info.assay_strain !== 'n.a.' ? info.assay_strain : null,
            activityType:
              info.activity_type !== 'n.a.' ? info.activity_type : null,
            activityTypeGrouped:
              info.activity_type_grouped !== 'n.a.'
                ? info.activity_type_grouped
                : null,
            activityRelation:
              info.activity_relation !== 'n.a.' ? info.activity_relation : null,
            activityValue:
              info.activity_value !== 'n.a.' ? info.activity_value : null,
            activityUnit:
              info.activity_units !== 'n.a.' ? info.activity_units : null,
            targetId: info.assay_tax_id !== 'n.a.' ? info.assay_tax_id : null,
            assayOrganism:
              info.assay_organism !== 'n.a.' ? info.assay_organism : null,
            refId: info.ref_id !== 'n.a.' ? info.ref_id : null,
            refIdType: info.ref_id_type ? info.ref_id_type : null,
            targetType:
              targetInfoActivity?.target_type &&
              targetInfoActivity.target_type !== ''
                ? targetInfoActivity.target_type
                : null,
            targetName:
              targetInfoActivity?.target_name &&
              targetInfoActivity.target_name !== ''
                ? targetInfoActivity.target_name
                : null,
            targetOrganism:
              targetInfoActivity?.target_organism &&
              targetInfoActivity.target_organism !== ''
                ? targetInfoActivity.target_organism
                : null,
            targetTaxId:
              targetInfoActivity?.target_tax_id &&
              targetInfoActivity.target_tax_id !== ''
                ? targetInfoActivity.target_tax_id
                : null,
            uniProtId:
              targetInfoActivity?.uniprot_id &&
              targetInfoActivity.uniprot_id !== ''
                ? targetInfoActivity.uniprot_id
                : null,
          };
          // delete all fields with null values
          for (const key in originalActivites) {
            if (originalActivites[key] === null) {
              delete originalActivites[key];
            }
          }
          finalActivities.push(originalActivites);
        }
      }

      // get taxonomies from which the molecule is derived

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
          if (infos?.superkingdom_name && infos?.superkingdom_name !== 'n.a.') {
            taxons.superkingdom = infos?.superkingdom_name;
          }
          if (
            infos?.superkingdom_tax_id &&
            infos?.superkingdom_tax_id !== 'n.a.'
          ) {
            taxons.superkingdomID = infos?.superkingdom_tax_id;
          }
          if (infos?.kingdom_name && infos?.kingdom_name !== 'n.a.') {
            taxons.kingdom = infos?.kingdom_name;
          }
          if (infos?.kingdom_tax_id && infos?.kingdom_tax_id !== 'n.a.') {
            taxons.kingdomID = infos?.kingdom_tax_id;
          }
          if (infos?.family_name && infos?.family_name !== 'n.a.') {
            taxons.family = infos?.family_name;
          }
          if (infos?.family_tax_id && infos?.family_tax_id !== 'n.a.') {
            taxons.familyID = infos?.family_tax_id;
          }
          if (infos?.genus_name && infos?.genus_name !== 'n.a.') {
            taxons.genus = infos?.genus_name;
          }
          if (infos?.genus_tax_id && infos?.genus_tax_id !== 'n.a.') {
            taxons.genusID = infos?.genus_tax_id;
          }
          if (infos?.species_name && infos?.species_name !== 'n.a.') {
            taxons.species = infos?.org_name;
          } else if (infos?.org_name && infos?.org_name !== 'n.a.') {
            taxons.species = infos?.org_name;
          }
          if (infos?.species_tax_id && infos?.species_tax_id !== 'n.a.') {
            taxons.speciesID = infos?.species_tax_id;
          } else if (infos?.org_tax_id && infos?.org_tax_id !== 'n.a.') {
            taxons.speciesID = infos?.org_tax_id;
          }

          if (Object.keys(taxons).length > 0) {
            finalTaxonomies.push(taxons);
          }
        }
      }
      // define final result
      const result = {
        _id: item.np_id,
        data: {
          ocl,
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
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'npasses',
        connection,
        stack: e.stack,
      });
    }
  }
}
