import OCL from 'openchemlib';

export async function* npAtlasParser(json) {
  for await (const entry of json) {
    try {
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
      if (doi) taxon.doi = doi;
      taxon.genus = taxonomies.genus;
      taxon.species = taxonomies.genus.concat(' ', taxonomies.species);
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

      if (finalTaxonomies.length !== 0)
        result.data.taxonomies = finalTaxonomies;

      if (entry.original_name) result.data.iupacName = entry.original_name; // not a true iupacName but property name need to be the same for aggregation

      yield result;
    } catch (e) {
      continue;
    }
  }
}
