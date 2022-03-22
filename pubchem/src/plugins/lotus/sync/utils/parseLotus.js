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
        finalTaxonomy.organismIdNCBI =
          taxonomySources.NCBI[0].cleaned_organism_id;
        finalTaxonomy.organismName = taxonomySources.NCBI[0].organism_value;
        finalTaxonomy.tree = [
          taxonomySources.NCBI[0].kingdom,
          taxonomySources.NCBI[0].phylum,
          taxonomySources.NCBI[0].classx,
          taxonomySources.NCBI[0].family,
          taxonomySources.NCBI[0].genus,
          taxonomySources.NCBI[0].species,
        ];
        status = true;
      }
      if ('GBIF Backbone Taxonomy' in taxonomySources && status === false) {
        finalTaxonomy.organismIdGBIF =
          taxonomySources['GBIF Backbone Taxonomy'][0].cleaned_organism_id;
        finalTaxonomy.organismName =
          taxonomySources['GBIF Backbone Taxonomy'][0].organism_value;
        finalTaxonomy.tree = [
          taxonomySources['GBIF Backbone Taxonomy'][0].kingdom,
          taxonomySources['GBIF Backbone Taxonomy'][0].phylum,
          taxonomySources['GBIF Backbone Taxonomy'][0].classx,
          taxonomySources['GBIF Backbone Taxonomy'][0].family,
          taxonomySources['GBIF Backbone Taxonomy'][0].genus,
          taxonomySources['GBIF Backbone Taxonomy'][0].species,
        ];
        status = true;
      }

      if ('iNaturalist' in taxonomySources && status === false) {
        finalTaxonomy.organismIdiNatur =
          taxonomySources.iNaturalist[0].cleaned_organism_id;
        finalTaxonomy.organismName =
          taxonomySources.iNaturalist[0].organism_value;
        finalTaxonomy.tree = [
          taxonomySources.iNaturalist[0].kingdom,
          taxonomySources.iNaturalist[0].phylum,
          taxonomySources.iNaturalist[0].classx,
          taxonomySources.iNaturalist[0].family,
          taxonomySources.iNaturalist[0].genus,
          taxonomySources.iNaturalist[0].species,
        ];
        status = true;
      }

      if ('Open Tree of Life' in taxonomySources && status === false) {
        finalTaxonomy.organismIdOTL =
          taxonomySources['Open Tree of Life'][0].cleaned_organism_id;
        finalTaxonomy.organismName =
          taxonomySources['Open Tree of Life'][0].organism_value;
        finalTaxonomy.tree = [
          taxonomySources['Open Tree of Life'][0].kingdom,
          taxonomySources['Open Tree of Life'][0].phylum,
          taxonomySources['Open Tree of Life'][0].classx,
          taxonomySources['Open Tree of Life'][0].family,
          taxonomySources['Open Tree of Life'][0].genus,
          taxonomySources['Open Tree of Life'][0].species,
        ];
        status = true;
      }
      if ('ITIS' in taxonomySources && status === false) {
        finalTaxonomy.organismIdITIS =
          taxonomySources.ITIS[0].cleaned_organism_id;
        finalTaxonomy.organismName = taxonomySources.ITIS[0].organism_value;
        finalTaxonomy.tree = [
          taxonomySources.ITIS[0].kingdom,
          taxonomySources.ITIS[0].phylum,
          taxonomySources.ITIS[0].classx,
          taxonomySources.ITIS[0].family,
          taxonomySources.ITIS[0].genus,
          taxonomySources.ITIS[0].species,
        ];
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
