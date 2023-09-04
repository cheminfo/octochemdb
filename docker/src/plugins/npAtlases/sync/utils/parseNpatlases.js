import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';
/**
 * @description parse NPATLAS file and return entries to be imported
 * @param {*} json - NPATLAS file
 * @param {*} connection - mongo connection
 * @yields {Object} yields the result to be imported
 */
export async function* parseNpatlases(json, connection) {
  const debug = debugLibrary('parseNpatlases');
  try {
    for await (const entry of json) {
      try {
        const oclMolecule = OCL.Molecule.fromSmiles(
          entry.clean_smiles || entry.smiles,
        );
        const ocl = await getNoStereosFromCache(
          oclMolecule,
          connection,
          'npAtlases',
        );
        const taxonomies = entry.origin_organism;
        const doi = entry.origin_reference.doi;
        let taxon = {};
        taxon.genusID = taxonomies.taxon.ncbi_id;
        taxon.genus = taxonomies.genus;
        taxon.species = taxonomies.genus.concat(' ', taxonomies.species);
        for (let i = 0; i < taxonomies.taxon.ancestors.length; i++) {
          let taxons = taxonomies.taxon.ancestors[i];

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
        if (doi) taxon.doi = doi;

        const finalTaxonomies = [];
        finalTaxonomies.push(taxon);
        const result = {
          _id: entry.npaid,
          data: {
            ocl,
          },
        };
        if (entry.pubchem_cid) result.data.cid = entry.pubchem_cid;

        if (finalTaxonomies.length !== 0) {
          result.data.taxonomies = finalTaxonomies;
        }

        if (entry.original_name) result.data.iupacName = entry.original_name; // not a true iupacName but property name need to be the same for aggregation

        yield result;
      } catch (e) {
        if (connection) {
          debug.warn(e.message, {
            collection: 'npAtlases',
            connection,
            stack: e.stack,
          });
        }
        continue;
      }
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'npAtlases',
        connection,
        stack: e.stack,
      });
    }
  }
}
