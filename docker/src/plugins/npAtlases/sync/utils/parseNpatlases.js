import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';
/**
 * Async generator that iterates over every compound in the NPAtlas JSON
 * dataset and yields a fully assembled {@link NpAtlasEntry} document
 * ready for MongoDB upsert.
 *
 * For each compound the function:
 * 1. Converts the SMILES (preferring `clean_smiles` over `smiles`) into an
 *    OpenChemLib molecule and computes a stereochemistry-independent
 *    tautomer ID via `getNoStereosFromCache`.
 * 2. Extracts the origin organism taxonomy (genus, species, higher ranks)
 *    from the nested `origin_organism.taxon.ancestors` array.
 * 3. Attaches optional PubChem CID and IUPAC name when available.
 *
 * Individual compound failures (e.g. invalid SMILES) are logged as warnings
 * and skipped; the outer iterator continues with the next compound.
 *
 * @param {NpAtlasJsonEntry[]} json - Array of NPAtlas compound objects
 *   parsed from the downloaded JSON file.
 * @param {OctoChemConnection | string} connection - Database connection
 *   instance (or the string `'test'`) used for the noStereo cache and
 *   error logging.
 * @yields {NpAtlasEntry} One document per valid compound.
 */
export async function* parseNpatlases(json, connection) {
  const debug = debugLibrary('parseNpatlases');
  try {
    for await (const entry of json) {
      try {
        // Convert SMILES to an OpenChemLib molecule (prefer cleaned SMILES)
        const smiles = entry.clean_smiles || entry.smiles;
        if (!smiles) continue;
        const oclMolecule = OCL.Molecule.fromSmiles(smiles);
        // Compute the stereo-independent tautomer ID (cached for performance)
        const ocl = await getNoStereosFromCache(
          oclMolecule,
          connection,
          'npAtlases',
        );
        // --- Build taxonomy information from the origin organism ---
        const taxonomies = entry.origin_organism;
        const doi = entry.origin_reference.doi;
        /** @type {NpAtlasTaxon} */
        const taxon = {};
        taxon.genusID = taxonomies.taxon.ncbi_id;
        taxon.genus = taxonomies.genus;
        taxon.species = taxonomies.genus.concat(' ', taxonomies.species);
        // Walk the ancestor chain and pick standard ranks
        for (let i = 0; i < taxonomies.taxon.ancestors.length; i++) {
          const taxons = taxonomies.taxon.ancestors[i];

          if (taxons.rank === 'kingdom') {
            taxon.kingdom = taxons.name;
          }
          if (taxons.rank === 'phylum') {
            taxon.phylum = taxons.name;
          }
          if (taxons.rank === 'class') {
            taxon.class = taxons.name;
          }
          if (taxons.rank === 'family') {
            taxon.family = taxons.name;
          }
        }
        // Attach DOI from reference when available
        if (doi) taxon.doi = doi;

        const finalTaxonomies = [];
        finalTaxonomies.push(taxon);
        // Assemble the final entry document
        /** @type {NpAtlasEntry} */
        const result = {
          _id: entry.npaid,
          data: {
            ocl,
          },
        };
        // Attach optional PubChem CID
        if (entry.pubchem_cid) result.data.cid = entry.pubchem_cid;

        if (finalTaxonomies.length !== 0) {
          result.data.taxonomies = finalTaxonomies;
        }

        // Attach original name as iupacName (name must match for aggregation)
        if (entry.original_name) result.data.iupacName = entry.original_name;

        yield result;
      } catch (e) {
        if (connection) {
          const err = e instanceof Error ? e : new Error(String(e));
          debug.warn(err.message, {
            collection: 'npAtlases',
            connection,
            stack: err.stack,
          });
        }
        continue;
      }
    }
  } catch (e) {
    if (connection) {
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'npAtlases',
        connection,
        stack: err.stack,
      });
    }
  }
}
