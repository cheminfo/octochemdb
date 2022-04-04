/* eslint-disable camelcase */
import { createReadStream } from 'fs';
import { join } from 'path';

import { bsonIterator } from 'bson-iterator';
import OCL from 'openchemlib';

export async function* parseLotus(bsonPath) {
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
      const gBifBackboneTaxonomy = [];
      const iNaturalist = [];
      const openTreeOfLife = [];
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
          gBifBackboneTaxonomy.push(result);
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
          openTreeOfLife.push(result);
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
        },
      };
      if (entry?.iupac_name) result.data.iupacName = entry?.iupac_name;
      if (
        ncbi.length !== 0 ||
        gBifBackboneTaxonomy.length !== 0 ||
        iNaturalist.length !== 0 ||
        openTreeOfLife.length !== 0 ||
        iTIS.length !== 0
      ) {
        result.data.taxonomies = {};
      }
      if (ncbi.length !== 0) result.data.taxonomies.ncbi = ncbi;
      if (gBifBackboneTaxonomy.length !== 0) {
        result.data.taxonomies.gBifBackboneTaxonomy = gBifBackboneTaxonomy;
      }
      if (iNaturalist.length !== 0) {
        result.data.taxonomies.iNaturalist = iNaturalist;
      }
      if (openTreeOfLife.length !== 0) {
        result.data.taxonomies.openTreeOfLife = openTreeOfLife;
      }
      if (iTIS.length !== 0) result.data.taxonomies.iTIS = iTIS;

      yield result;
    } catch (e) {
      continue;
    }
  }
}
