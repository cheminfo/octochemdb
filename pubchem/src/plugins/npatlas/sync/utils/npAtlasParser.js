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

    let tax = { kingdom: [], phylum: [], class: [], family: [] };
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
      taxonomy: {
        genusIdNCBI: taxonomy.taxon.ncbi_id,
        organismName: taxonomy.genus.concat(taxonomy.species),
        tree: [
          tax.kingdom,
          tax.phylum,
          tax.class,
          tax.family,
          taxonomy.genus,
          taxonomy.genus.concat(taxonomy.species),
        ],
      },
    };

    const result = {
      ocl: {
        id: oclID.idCode,
        coordinates: oclID.coordinates,
        noStereoID,
      },
      origin: {
        taxonomy: finalTaxonomy.taxonomy,
      },
      doi: doi,
    };

    results.push(result);
  }
  return results;
}
//https://www.npatlas.org/static/downloads/NPAtlas_download.json
