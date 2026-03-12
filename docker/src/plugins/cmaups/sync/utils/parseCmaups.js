import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

import { getActivities } from './getActivities.js';
import { recursiveRemoveNa } from './recursiveRemoveNa.js';

const debug = debugLibrary('parseCmaups');
/**
 * Parses the five CMAUP source files and yields one `CmaupsEntry` document
 * per ingredient, ready to be upserted into MongoDB.
 *
 * For each row in the Ingredients file the function:
 *  1. Resolves the OCL structural representation (idCode, noStereoTautomerID,
 *     coordinates) from the SMILES string via `getNoStereosFromCache`.
 *  2. Builds a flat list of raw taxonomy objects by joining speciesAssociation
 *     pairs with the Plants species-info map.
 *  3. Collects and enriches biological activities from the Activity file,
 *     cross-referenced with target metadata from the Targets file.
 *  4. Assembles the final result object, calls `recursiveRemoveNa` to strip
 *     "N/A" placeholders, and yields it to the caller.
 *
 * Per-entry errors (e.g. an unparseable SMILES) are persisted to the admin
 * collection via `debug.fatal` and the entry is skipped; they are not
 * re-thrown so that a single bad row cannot abort the whole import.
 *
 * @param {CmaupsGeneralRow[]} general - Parsed rows from the Ingredients file.
 * @param {CmaupsActivityMap} activities - Map of ingredient ID → activity rows from the Activity file.
 * @param {CmaupsSpeciesPairList} speciesPair - Species-association pairs (columns: Plant_ID, Ingredient_ID).
 * @param {CmaupsSpeciesInfoMap} speciesInfo - Map of Plant_ID → species-info row from the Plants file.
 * @param {CmaupsTargetInfoMap} targetInfo - Map of Target_ID → target-info row from the Targets file.
 * @param {OctoChemConnection} connection - Active database connection wrapper.
 * @yields {CmaupsEntry}
 * @returns {AsyncGenerator<CmaupsEntry>}
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
    /** @type {SpeciesPairedMap} */
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
          /** @type {MaybeOclData} */
          let ocl;
          try {
            const oclMolecule = OCL.Molecule.fromSmiles(smilesDb);
            ocl = await getNoStereosFromCache(
              oclMolecule,
              connection,
              'cmaups',
            );
          } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            if (connection) {
              debug.fatal(err.message, {
                collection: 'cmaups',
                connection,
                stack: err.stack,
              });
            }

            continue;
          }
          // Get raw data taxonomies
          const orgIDs = speciesPaired[id];
          /** @type {CmaupsSpeciesInfoRow[]} */
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
          const finalTaxonomies = [];
          if (taxonomies.length > 0) {
            for (const infos of taxonomies) {
              // `infos` itself is non-null (gated by `if (speciesInfo[idOrg])` above),
              // but each individual field (e.g. Plant_Name, Genus_Tax_ID) may still be
              // undefined — hence the explicit truthiness guard on every property below.
              /** @type {CmaupsTaxonomyEntry} */
              const taxons = {};
              if (infos.Species_Tax_ID) {
                taxons.speciesID = infos.Species_Tax_ID;
              }
              if (infos.Plant_Name) {
                taxons.species = infos.Plant_Name;
              }
              if (infos.Genus_Tax_ID) {
                taxons.genusID = infos.Genus_Tax_ID;
              }
              if (infos.Genus_Name) {
                taxons.genus = infos.Genus_Name;
              }
              if (infos.Family_Tax_ID) {
                taxons.familyID = infos.Family_Tax_ID;
              }
              if (infos.Family_Name) {
                taxons.family = infos.Family_Name;
              }
              if (Object.keys(taxons).length > 0) {
                finalTaxonomies.push(taxons);
              }
            }
          }
          // Create object containing final result
          // item is non-null: sourced directly from the `for await` iterator over `general`
          /** @type {CmaupsEntry} */
          const result = {
            _id: item.np_id,
            data: {
              ocl,
            },
          };
          if (item.pubchem_cid) result.data.cid = item.pubchem_cid;
          if (finalTaxonomies.length > 0) {
            result.data.taxonomies = finalTaxonomies;
          }
          if (item.pref_name) {
            result.data.commonName = item.pref_name;
          }
          if (item.chembl_id) {
            result.data.chemblId = item.chembl_id;
          }

          if (finalActivities.length > 0) {
            result.data.activities = finalActivities;
          }

          recursiveRemoveNa(result);
          yield result;
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        if (connection) {
          debug.fatal(err.message, {
            collection: 'cmaups',
            connection,
            stack: err.stack,
          });
        }
      }
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'cmaups',
        connection,
        stack: err.stack,
      });
    }
  }
}
