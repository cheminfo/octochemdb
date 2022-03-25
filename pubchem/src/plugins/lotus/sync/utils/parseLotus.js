import { createReadStream } from 'fs';
import { join } from 'path';

import { bsonIterator } from 'bson-iterator';
import OCL from 'openchemlib';

export async function parseLotus(bsonPath) {
  const results = [];
  const readStream = createReadStream(join(bsonPath));

  for await (const entry of bsonIterator(readStream)) {
    try {
      const oclMolecule = OCL.Molecule.fromSmiles(entry.smiles);
      const oclID = oclMolecule.getIDCodeAndCoordinates();
      oclMolecule.stripStereoInformation();
      const noStereoID = oclMolecule.getIDCode();
      const taxonomy = entry.taxonomyReferenceObjects;
      const key = Object.keys(taxonomy)[0];
      const taxonomySources = taxonomy[key];
      const finalTaxonomy = {};
      let status = false;
      if ('NCBI' in taxonomySources) {
        finalTaxonomy.kingdom = taxonomySources.NCBI[0]?.kingdom;
        finalTaxonomy.phylum = taxonomySources.NCBI[0]?.phylum;
        finalTaxonomy.class = taxonomySources.NCBI[0]?.classx;
        finalTaxonomy.family = taxonomySources.NCBI[0]?.family;
        finalTaxonomy.genus = taxonomySources.NCBI[0]?.genus;
        finalTaxonomy.species = taxonomySources.NCBI[0]?.species;
        status = true;
      }
      if ('GBIF Backbone Taxonomy' in taxonomySources && status === false) {
        finalTaxonomy.kingdom =
          taxonomySources['GBIF Backbone Taxonomy'][0]?.kingdom;
        finalTaxonomy.phylum =
          taxonomySources['GBIF Backbone Taxonomy'][0]?.phylum;
        finalTaxonomy.class =
          taxonomySources['GBIF Backbone Taxonomy'][0]?.classx;
        finalTaxonomy.family =
          taxonomySources['GBIF Backbone Taxonomy'][0]?.family;
        finalTaxonomy.genus =
          taxonomySources['GBIF Backbone Taxonomy'][0]?.genus;
        finalTaxonomy.species =
          taxonomySources['GBIF Backbone Taxonomy'][0]?.species;
        status = true;
      }

      if ('iNaturalist' in taxonomySources && status === false) {
        finalTaxonomy.kingdom = taxonomySources.iNaturalist[0]?.kingdom;
        finalTaxonomy.phylum = taxonomySources.iNaturalist[0]?.phylum;
        finalTaxonomy.class = taxonomySources.iNaturalist[0]?.classx;
        finalTaxonomy.family = taxonomySources.iNaturalist[0]?.family;
        finalTaxonomy.genus = taxonomySources.iNaturalist[0]?.genus;
        finalTaxonomy.species = taxonomySources.iNaturalist[0]?.species;

        status = true;
      }

      if ('Open Tree of Life' in taxonomySources && status === false) {
        finalTaxonomy.kingdom =
          taxonomySources['Open Tree of Life'][0]?.kingdom;
        finalTaxonomy.phylum = taxonomySources['Open Tree of Life'][0]?.phylum;
        finalTaxonomy.class = taxonomySources['Open Tree of Life'][0]?.classx;
        finalTaxonomy.family = taxonomySources['Open Tree of Life'][0]?.family;
        finalTaxonomy.genus = taxonomySources['Open Tree of Life'][0]?.genus;
        finalTaxonomy.species =
          taxonomySources['Open Tree of Life'][0]?.species;

        status = true;
      }
      if ('ITIS' in taxonomySources && status === false) {
        finalTaxonomy.kingdom = taxonomySources.ITIS[0]?.kingdom;
        finalTaxonomy.phylum = taxonomySources.ITIS[0]?.phylum;
        finalTaxonomy.class = taxonomySources.ITIS[0]?.classx;
        finalTaxonomy.family = taxonomySources.ITIS[0]?.family;
        finalTaxonomy.genus = taxonomySources.ITIS[0]?.genus;
        finalTaxonomy.species = taxonomySources.ITIS[0]?.species;
      }

      const result = {
        _id: entry.lotus_id,
        ocl: {
          id: oclID.idCode,
          coordinates: oclID.coordinates,
          noStereoID,
        },
        origin: {
          taxonomy: finalTaxonomy,
        },
      };
      results.push(result);
    } catch (__java$exception) {
      continue;
    }
  }
  return results;
}
