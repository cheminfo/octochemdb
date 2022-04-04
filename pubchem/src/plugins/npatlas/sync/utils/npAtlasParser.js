import OCL from 'openchemlib';

import Debug from '../../../../utils/Debug.js';

const debug = Debug('npAtlasParser');
export function npAtlasParser(json) {
  const results = [];
  let counter = 0;
  let start = Date.now();
  for (const entry of json) {
    const oclMolecule = OCL.Molecule.fromSmiles(entry.smiles);
    const oclID = oclMolecule.getIDCodeAndCoordinates();
    oclMolecule.stripStereoInformation();
    const noStereoID = oclMolecule.getIDCode();
    const taxonomies = entry.origin_organism;
    const doi = entry.origin_reference.doi;
    let taxon = {};
    taxon.genusID = taxonomies.taxon.ncbi_id;
    for (let i = 0; i < taxonomies.taxon.ancestors.length; i++) {
      let taxon = taxonomies.taxon.ancestors[i];

      if (taxon.rank === 'kingdom') {
        taxon.kingdom = taxon.name;
      }
      if (taxon.rank === 'phylum') {
        taxon.phylum = taxon.name;
      }
      if (taxon.rank === 'class') {
        taxon.class = taxon.name;
      }
      if (taxon.rank === 'family') {
        taxon.family = taxon.name;
      }
    }
    taxon.genus = taxonomies.genus;
    taxon.species = taxonomies.genus.concat(taxonomies.species);
    const finalTaxonomies = [];
    finalTaxonomies.push(taxon);
    const result = {
      _id: entry.npaid,
      data: {
        ocl: {
          id: oclID.idCode,
          coordinates: oclID.coordinates,
          noStereoID,
        },
      },
    };
    if (entry.pubchem_cid) result.data.cid = entry.pubchem_cid;
    if (finalTaxonomies.length !== 0) result.data.taxonomies = finalTaxonomies;
    if (doi) result.data.doi = doi;
    if (entry.original_name) result.data.moleculeName = entry.original_name;
    if (Date.now() - start > 10000) {
      debug(`Processing: counter: ${counter} `);
      start = Date.now();
    }
    counter++;
    results.push(result);
  }
  return results;
}
