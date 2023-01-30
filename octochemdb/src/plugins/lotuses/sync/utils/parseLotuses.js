import { bsonIterator } from 'bson-iterator';
import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';
import readStreamInZipFolder from '../../../../utils/readStreamInZipFolder.js';

const debug = debugLibrary('parseLotuses');

/**
 * @description parse lotus file and yield data to be imported
 * @param {*} lotusFilePath - path to lotus file
 * @param {*} filename - filename inside zip folder to use for importation
 * @param {*} connection - mongo connection
 * @yields {Object} - data to be imported
 */
export async function* parseLotuses(lotusFilePath, filename, connection) {
  try {
    const readStream = await readStreamInZipFolder(lotusFilePath, filename);

    for await (const entry of bsonIterator(readStream)) {
      try {
        // generate molecule from smiles
        // get noStereoID for the molecule
        const oclMolecule = OCL.Molecule.fromSmiles(entry.smiles);
        const ocl = await getNoStereosFromCache(oclMolecule, connection);
        // parse taxonomies
        const taxonomy = entry.taxonomyReferenceObjects;
        const key = Object.keys(taxonomy)[0];
        const taxonomySources = taxonomy[key];
        const ncbi = [];
        const gBifBackboneTaxonomy = [];
        const iNaturalist = [];
        const openTreeOfLife = [];
        const iTIS = [];
        // keep information of all taxonomies sources
        if ('NCBI' in taxonomySources) {
          for (let entry of taxonomySources.NCBI) {
            const result = {};
            if (entry?.cleaned_organism_id) {
              result.organismID = entry?.cleaned_organism_id;
            }
            if (entry?.kingdom) result.kingdom = entry?.kingdom;
            if (entry?.phylum) result.phylum = entry?.phylum;
            if (entry?.classx) result.class = entry?.classx;
            if (entry?.family) result.family = entry?.family;
            if (entry?.genus) result.genus = entry?.genus;
            if (entry?.species) result.species = entry?.species;
            ncbi.push(result);
          }
        }

        if ('GBIF Backbone Taxonomy' in taxonomySources) {
          for (let entry of taxonomySources['GBIF Backbone Taxonomy']) {
            const result = {};
            if (entry?.cleaned_organism_id) {
              result.organismID = entry?.cleaned_organism_id;
            }
            if (entry?.kingdom) result.kingdom = entry?.kingdom;
            if (entry?.phylum) result.phylum = entry?.phylum;
            if (entry?.classx) result.class = entry?.classx;
            if (entry?.family) result.family = entry?.family;
            if (entry?.genus) result.genus = entry?.genus;
            if (entry?.species) result.species = entry?.species;
            gBifBackboneTaxonomy.push(result);
          }
        }

        if ('iNaturalist' in taxonomySources) {
          for (let entry of taxonomySources.iNaturalist) {
            const result = {};
            if (entry?.cleaned_organism_id) {
              result.organismID = entry?.cleaned_organism_id;
            }
            if (entry?.kingdom) result.kingdom = entry?.kingdom;
            if (entry?.phylum) result.phylum = entry?.phylum;
            if (entry?.classx) result.class = entry?.classx;
            if (entry?.family) result.family = entry?.family;
            if (entry?.genus) result.genus = entry?.genus;
            if (entry?.species) result.species = entry?.species;
            iNaturalist.push(result);
          }
        }

        if ('Open Tree of Life' in taxonomySources) {
          for (let entry of taxonomySources['Open Tree of Life']) {
            const result = {};
            if (entry?.cleaned_organism_id) {
              result.organismID = entry?.cleaned_organism_id;
            }
            if (entry?.kingdom) result.kingdom = entry?.kingdom;
            if (entry?.phylum) result.phylum = entry?.phylum;
            if (entry?.classx) result.class = entry?.classx;
            if (entry?.family) result.family = entry?.family;
            if (entry?.genus) result.genus = entry?.genus;
            if (entry?.species) result.species = entry?.species;
            openTreeOfLife.push(result);
          }
        }
        if ('ITIS' in taxonomySources) {
          for (let entry of taxonomySources.ITIS) {
            const result = {};
            if (entry?.cleaned_organism_id) {
              result.organismID = entry?.cleaned_organism_id;
            }
            if (entry?.kingdom) result.kingdom = entry?.kingdom;
            if (entry?.classx) result.class = entry?.classx;
            if (entry?.family) result.family = entry?.family;
            if (entry?.genus) result.genus = entry?.genus;
            if (entry?.species) result.species = entry?.species;
            iTIS.push(result);
          }
        }
        // define data to be yielded
        const result = {
          _id: entry.lotus_id,
          data: {
            ocl,
          },
        };
        if (entry?.iupac_name) result.data.iupacName = entry?.iupac_name;
        if (
          ncbi?.length !== 0 ||
          gBifBackboneTaxonomy?.length !== 0 ||
          iNaturalist?.length !== 0 ||
          openTreeOfLife?.length !== 0 ||
          iTIS?.length !== 0
        ) {
          result.data.taxonomies = {};
        }
        if (ncbi?.length !== 0) result.data.taxonomies.ncbi = ncbi;
        if (gBifBackboneTaxonomy?.length !== 0) {
          result.data.taxonomies.gBifBackboneTaxonomy = gBifBackboneTaxonomy;
        }
        if (iNaturalist?.length !== 0) {
          result.data.taxonomies.iNaturalist = iNaturalist;
        }
        if (openTreeOfLife?.length !== 0) {
          result.data.taxonomies.openTreeOfLife = openTreeOfLife;
        }
        if (iTIS?.length !== 0) result.data.taxonomies.iTIS = iTIS;
        yield result;
      } catch (e) {
        if (connection) {
          debug(e.message, {
            collection: 'lotuses',
            connection,
            stack: e.stack,
          });
        }
        continue;
      }
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'lotuses', connection, stack: e.stack });
    }
  }
}
