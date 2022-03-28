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

      const ncbi = [];
      const gBIF_Backbone_Taxonomy = [];
      const iNaturalist = [];
      const open_Tree_of_Life = [];
      const iTIS = [];

      if ('NCBI' in taxonomySources) {
        for (let entry of taxonomySources.NCBI) {
          const result = {};
          result.organismID = entry?.cleaned_organism_id;
          result.kingdom = entry?.kingdom;
          result.phylum = entry?.phylum;
          result.class = entry?.classx;
          result.family = entry?.family;
          result.genus = entry?.genus;
          result.species = entry?.species;
          ncbi.push(result);
        }
      }
      if ('GBIF Backbone Taxonomy' in taxonomySources) {
        for (let entry of taxonomySources['GBIF Backbone Taxonomy']) {
          const result = {};
          result.organismID = entry?.cleaned_organism_id;
          result.kingdom = entry?.kingdom;
          result.phylum = entry?.phylum;
          result.class = entry?.classx;
          result.family = entry?.family;
          result.genus = entry?.genus;
          result.species = entry?.species;
          gBIF_Backbone_Taxonomy.push(result);
        }
      }

      if ('iNaturalist' in taxonomySources) {
        for (let entry of taxonomySources.iNaturalist) {
          const result = {};
          result.organismID = entry?.cleaned_organism_id;
          result.kingdom = entry?.kingdom;
          result.phylum = entry?.phylum;
          result.class = entry?.classx;
          result.family = entry?.family;
          result.genus = entry?.genus;
          result.species = entry?.species;
          iNaturalist.push(result);
        }
      }

      if ('Open Tree of Life' in taxonomySources) {
        for (let entry of taxonomySources['Open Tree of Life']) {
          const result = {};
          result.organismID = entry?.cleaned_organism_id;
          result.kingdom = entry?.kingdom;
          result.phylum = entry?.phylum;
          result.class = entry?.classx;
          result.family = entry?.family;
          result.genus = entry?.genus;
          result.species = entry?.species;
          open_Tree_of_Life.push(result);
        }
      }
      if ('ITIS' in taxonomySources) {
        for (let entry of taxonomySources.ITIS) {
          const result = {};
          result.organismID = entry?.cleaned_organism_id;
          result.kingdom = entry?.kingdom;
          result.class = entry?.classx;
          result.family = entry?.family;
          result.genus = entry?.genus;
          result.species = entry?.species;
          iTIS.push(result);
        }
      }
      const result = {
        _id: entry.lotus_id,
        data: {
          ocl: {
            id: oclID.idCode,
            coordinates: oclID.coordinates,
            noStereoID,
          },
          taxonomy: {
            NCBI: ncbi,
            GBIF_Backbone_Taxonomy: gBIF_Backbone_Taxonomy,
            iNaturalist: iNaturalist,
            Open_Tree_of_Life: open_Tree_of_Life,
            ITIS: iTIS,
          },
          iupac_Name: entry?.iupac_name,
        },
      };
      results.push(result);
    } catch (__java$exception) {
      continue;
    }
  }
  return results;
}
