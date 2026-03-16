import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

/**
 * Async generator that iterates over every compound in the NPASS
 * general-info dataset and yields a fully enriched {@link NpassesEntry}
 * document ready for MongoDB upsert.
 *
 * For each compound the function:
 * 1. Looks up its SMILES in the `properties` map and skips the entry if
 *    no SMILES is available (we need a valid structure).
 * 2. Converts the SMILES to an OpenChemLib (OCL) molecule and computes a
 *    stereochemistry-independent tautomer ID via `getNoStereosFromCache`.
 * 3. Collects all bioactivity rows associated with the compound, enriches
 *    each one with target metadata (name, organism, UniProt ID, etc.) from
 *    the `targetInfo` map, and strips `"n.a."` sentinel values.
 * 4. Resolves organism IDs through the `speciesPair` → `speciesInfo` maps
 *    to build a list of parsed taxonomy objects.
 * 5. Assembles the final entry document and yields it.
 *
 * @param {NpassesGeneralRow[]} general - Array of general-info rows parsed
 *   from the NPASS TSV; each row represents one natural product.
 * @param {NpassesActivityMap} activities - `np_id` → activity-row array
 *   lookup built by {@link readNpassesLastFiles}.
 * @param {NpassesPropertyMap} properties - `np_id` → property (structure)
 *   row lookup containing SMILES/InChI data.
 * @param {NpassesSpeciesPairMap} speciesPair - `np_id` → `org_id[]` lookup
 *   that maps a compound to the organisms from which it was isolated.
 * @param {NpassesSpeciesInfoMap} speciesInfo - `org_id` → species-info
 *   row lookup with full taxonomy information.
 * @param {NpassesTargetInfoMap} targetInfo - `target_id` → target-info
 *   row lookup with target name, type, organism, and UniProt ID.
 * @param {OctoChemConnection | string} connection - Database connection
 *   instance (or the string `'test'`) used for the noStereo cache and
 *   error logging.
 * @yields {NpassesEntry} One document per valid compound.
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
    // Iterate over every compound in the general-info dataset
    for await (const item of general) {
      // Look up the structural properties (SMILES, InChI, etc.) by np_id
      const property = properties[item.np_id];
      // Skip compounds with no SMILES – we cannot compute a molecular structure
      if (property?.SMILES === undefined) {
        continue;
      }
      // Convert SMILES to an OpenChemLib molecule object
      const smilesDb = property.SMILES;
      const oclMolecule = OCL.Molecule.fromSmiles(smilesDb);
      // Compute the stereo-independent tautomer ID (cached for performance)
      const ocl = await getNoStereosFromCache(
        oclMolecule,
        connection,
        'npasses',
      );
      // --- Build the activities list for this compound ---
      const activity = activities[item.np_id];
      const finalActivities = [];
      if (activity !== undefined) {
        for (const info of activity) {
          // Enrich with target metadata (name, organism, UniProt ID…)
          const targetInfoActivity = targetInfo[info.target_id];

          // Map raw TSV fields → clean camelCase keys.
          // Fields equal to "n.a." are set to null (removed later).
          const originalActivites = {
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
              targetInfoActivity?.target_organism_tax_id &&
              targetInfoActivity.target_organism_tax_id !== ''
                ? targetInfoActivity.target_organism_tax_id
                : null,
            uniProtId:
              targetInfoActivity?.uniprot_id &&
              targetInfoActivity.uniprot_id !== ''
                ? targetInfoActivity.uniprot_id
                : null,
          };
          // Remove null-valued fields to keep the stored document lean
          /** @type {NpassesParsedActivity} */
          const activitiesRecord = originalActivites;
          for (const key in activitiesRecord) {
            if (activitiesRecord[key] === null) {
              delete activitiesRecord[key];
            }
          }
          finalActivities.push(activitiesRecord);
        }
      }

      // --- Build taxonomy information from organism IDs ---
      // speciesPair maps np_id → array of org_id strings
      const orgIDs = speciesPair[item.np_id];
      // Resolve each org_id to its full species-info row
      /** @type {NpassesSpeciesInfoRow[]} */
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
      // Convert raw species-info rows into clean NpassesParsedTaxonomy objects.
      // Only non-empty, non-"n.a." taxonomy ranks are included.
      /** @type {NpassesParsedTaxonomy[]} */
      const finalTaxonomies = [];

      if (taxonomies.length > 0) {
        for (const infos of taxonomies) {
          // Build a taxonomy object including only ranks that carry real data
          /** @type {NpassesParsedTaxonomy} */
          const taxons = {};
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
          // Fall back to org_name / org_tax_id when species-level data is absent
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
      // --- Assemble the final entry document ---
      /** @type {NpassesEntry} */
      const result = {
        _id: item.np_id,
        data: {
          ocl,
        },
      };
      // Attach optional PubChem CID, taxonomies, and activities when available
      if (item.pubchem_id) result.data.cid = item.pubchem_id;
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
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'npasses',
        connection,
        stack: err.stack,
      });
    }
  }
}
