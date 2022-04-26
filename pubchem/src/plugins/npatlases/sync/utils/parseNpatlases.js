import OCL from 'openchemlib';
import Debug from '../../../../utils/Debug.js';

export async function* parseNpatlases(json, parseSkip, connection) {
  const debug = Debug('parseNpatlases');
  try {
    let skipping = true;
    for await (const entry of json) {
      if (skipping && parseSkip !== undefined) {
        if (parseSkip === entry.npaid) {
          skipping = false;
          debug(`Skipping compound till:${entry.npaid}`);
        }
        continue;
      }
      try {
        const oclMolecule = OCL.Molecule.fromSmiles(entry.smiles);
        const oclID = oclMolecule.getIDCodeAndCoordinates();
        oclMolecule.stripStereoInformation();
        const noStereoID = oclMolecule.getIDCode();
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
  } catch (e) {
    const optionsDebug = { collection: 'npAtlases', connection };
    debug(e, optionsDebug);
  }
}
