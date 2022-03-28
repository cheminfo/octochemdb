import OCL from 'openchemlib';

export function npAtlasParser(json) {
  const results = [];
  for (const entry of json) {
    const oclMolecule = OCL.Molecule.fromSmiles(entry.smiles);
    const oclID = oclMolecule.getIDCodeAndCoordinates();
    oclMolecule.stripStereoInformation();
    const noStereoID = oclMolecule.getIDCode();
    const taxonomy = entry.origin_organism;
    const doi = entry.origin_reference.doi;
    let tax = {};
    for (let i = 0; i < taxonomy.taxon.ancestors.length; i++) {
      let taxon = taxonomy.taxon.ancestors[i];

      if (taxon.rank === 'kingdom') {
        tax.kingdom = taxon.name;
      }
      if (taxon.rank === 'phylum') {
        tax.phylum = taxon.name;
      }
      if (taxon.rank === 'class') {
        tax.class = taxon.name;
      }
      if (taxon.rank === 'family') {
        tax.family = taxon.name;
      }
    }

    const finalTaxonomy = {
      genusID: taxonomy.taxon.ncbi_id,
      kingdom: tax.kingdom,
      phylum: tax.phylum,
      class: tax.class,
      family: tax.family,
      genus: taxonomy.genus,
      species: taxonomy.genus.concat(taxonomy.species),
    };

    const result = {
      _id: entry.npaid,
      data: {
        ocl: {
          id: oclID.idCode,
          coordinates: oclID.coordinates,
          noStereoID,
        },
        taxonomy: [finalTaxonomy],
        doi: doi,
        moleculeName: entry.original_name,
      },
    };

    results.push(result);
  }
  return results;
}
