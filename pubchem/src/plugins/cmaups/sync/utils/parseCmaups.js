import OCL from 'openchemlib';

import Debug from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

const debug = Debug('parseCmaups');
/**
 * @description parse the cmaups files and return the data to be imported in the database
 * @param {*} general the general data readed from the file
 * @param {*} activities the activities data readed from the file
 * @param {*} speciesPair the species association data readed from the file
 * @param {*} speciesInfo the species info data readed from the file
 * @param {*} connection the connection to the database
 * @returns {Object} results to be imported in the database
 */
export async function* parseCmaups(
  general,
  activities,
  speciesPair,
  speciesInfo,
  connection,
) {
  try {
    // get relation between molecule ID and taxonomies IDs
    const speciesPaired = {};
    for (const pair of speciesPair) {
      if (!speciesPaired[pair[1]]) {
        speciesPaired[pair[1]] = [];
      }
      speciesPaired[pair[1]].push(pair[0]);
    }
    // Start parsing each molecule in general data
    for await (const item of general) {
      try {
        if (Object.keys(item.Ingredient_ID).length > 0) {
          // Get molecule ID
          const id = item.Ingredient_ID;
          // Get activities related to molecule ID
          const activity = activities[id];
          const finalActivities = [];
          if (activity !== undefined) {
            for (const info of activity) {
              finalActivities.push({
                activityType: info?.Activity_Type,
                activityValue: info?.Activity_Value,
                activityUnit: info?.Activity_Unit,
                refIdType: info?.Reference_ID_Type,
                refId: info?.Reference_ID,
              });
            }
          }
          // Get molecule structure data
          const smilesDb = item.__parsed_extra.slice(-1)[0];
          let ocl;
          try {
            const oclMolecule = OCL.Molecule.fromSmiles(smilesDb);
            ocl = await getNoStereosFromCache(oclMolecule, connection);
          } catch (e) {
            if (connection) {
              debug(e.message, {
                collection: 'cmaups',
                connection,
                stack: e.stack,
              });
            }

            continue;
          }
          // Get raw data taxonomies
          const orgIDs = speciesPaired[id];
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
          // Format taxonomies data
          let finalTaxonomies = [];
          if (taxonomies.length > 0) {
            for (const infos of taxonomies) {
              let taxons = {};
              if (infos?.Species_Tax_ID && infos?.Species_Tax_ID !== 'NA') {
                taxons.speciesID = infos.Species_Tax_ID;
              }
              if (infos?.Plant_Name && infos?.Plant_Name !== 'NA') {
                taxons.species = infos?.Plant_Name;
              }
              if (infos?.Genus_Tax_ID && infos?.Genus_Tax_ID !== 'NA') {
                taxons.genusID = infos?.Genus_Tax_ID;
              }
              if (infos?.Genus_Name && infos?.Genus_Name !== 'NA') {
                taxons.genus = infos?.Genus_Name;
              }

              if (infos?.Family_Tax_ID && infos?.Family_Tax_ID !== 'NA') {
                taxons.familyID = infos?.Family_Tax_ID;
              }
              if (infos?.Family_Name && infos?.Family_Name !== 'NA') {
                taxons.family = infos?.Family_Name;
              }
              if (Object.keys(taxons).length > 0) {
                finalTaxonomies.push(taxons);
              }
            }
          }
          // Create object containing final result
          const result = {
            _id: item.Ingredient_ID,
            data: {
              ocl,
            },
          };
          if (item.pubchem_cid) result.data.cid = item.pubchem_cid;
          if (finalTaxonomies.length > 0) {
            result.data.taxonomies = finalTaxonomies;
          }
          if (finalActivities.length > 0) {
            result.data.activities = finalActivities;
          }
          yield result;
        }
      } catch (e) {
        if (connection) {
          debug(e.message, {
            collection: 'cmaups',
            connection,
            stack: e.stack,
          });
        }
      }
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'cmaups', connection, stack: e.stack });
    }
  }
}
