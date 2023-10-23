import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

import { getActivities } from './getActivities.js';
import { recursiveRemoveNa } from './recursiveRemoveNa.js';

const debug = debugLibrary('parseCmaups');
/**
 * @description parse the cmaups files and return the data to be imported in the database
 * @param {*} general the general data readed from the file
 * @param {*} activities the activities data readed from the file
 * @param {*} speciesPair the species association data readed from the file
 * @param {*} speciesInfo the species info data readed from the file
 * @param {*} targetInfo the target info data readed from the file
 * @param {*} connection the connection to the database
 * @returns {Object} results to be imported in the database
 */
export async function* parseCmaups(
  general,
  activities,
  speciesPair,
  speciesInfo,
  targetInfo,
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
        if (item.np_id !== undefined) {
          // Get molecule ID
          const id = item.np_id;
          // Get activities related to molecule ID
          const activity = activities[id];
          //  console.log(item);
          const finalActivities = getActivities(activity, targetInfo);

          // Get molecule structure data
          const smilesDb = item.SMILES;
          let ocl;
          try {
            const oclMolecule = OCL.Molecule.fromSmiles(smilesDb);
            ocl = await getNoStereosFromCache(
              oclMolecule,
              connection,
              'cmaups',
            );
          } catch (e) {
            if (connection) {
              debug.fatal(e.message, {
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
              if (infos?.Species_Tax_ID) {
                taxons.speciesID = infos.Species_Tax_ID;
              }
              if (infos?.Plant_Name) {
                taxons.species = infos?.Plant_Name;
              }
              if (infos?.Genus_Tax_ID) {
                taxons.genusID = infos?.Genus_Tax_ID;
              }
              if (infos?.Genus_Name) {
                taxons.genus = infos?.Genus_Name;
              }

              if (infos?.Family_Tax_ID) {
                taxons.familyID = infos?.Family_Tax_ID;
              }
              if (infos?.Family_Name) {
                taxons.family = infos?.Family_Name;
              }
              if (Object.keys(taxons).length > 0) {
                finalTaxonomies.push(taxons);
              }
            }
          }
          // Create object containing final result
          let result = {
            _id: item.np_id,
            data: {
              ocl,
            },
          };
          if (item.pubchem_cid) result.data.cid = item.pubchem_cid;
          if (finalTaxonomies.length > 0) {
            result.data.taxonomies = finalTaxonomies;
          }
          if (item?.pref_name) {
            result.data.commonName = item.pref_name;
          }
          if (item?.chembl_id) {
            result.data.chemblId = item.chembl_id;
          }

          if (finalActivities.length > 0) {
            result.data.activities = finalActivities;
          }

          recursiveRemoveNa(result);
          yield result;
        }
      } catch (e) {
        if (connection) {
          debug.fatal(e.message, {
            collection: 'cmaups',
            connection,
            stack: e.stack,
          });
        }
      }
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'cmaups',
        connection,
        stack: e.stack,
      });
    }
  }
}
