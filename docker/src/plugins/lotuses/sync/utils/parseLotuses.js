import { bsonIterator } from 'bson-iterator';
import { fileCollectionFromPath } from 'filelist-utils';
import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';
import readStreamInZipFolder from '../../../../utils/readStreamInZipFolder.js';

const debug = debugLibrary('parseLotuses');

/**
 * Parses a LOTUS BSON dump file (inside a ZIP archive) and yields one
 * `LotusEntry` document per compound, ready to be upserted into MongoDB.
 *
 * For each BSON record the function:
 *  1. Resolves the OCL structural representation (idCode, noStereoTautomerID,
 *     coordinates) from the SMILES string via `getNoStereosFromCache`.
 *  2. Extracts taxonomy data from all available sources (NCBI, GBIF, etc.)
 *     into a normalised `LotusRawTaxonomies` object.
 *  3. Assembles and yields the final `LotusEntry` document.
 *
 * Per-row errors (e.g. an unparseable SMILES) are logged via `debug.warn`
 * and the row is skipped; they are not re-thrown so that a single bad record
 * cannot abort the whole import.
 *
 * @param {string} lotusFilePath - Path to the directory containing the LOTUS
 *   ZIP file (or its parent folder in test mode).
 * @param {string} filename - Name of the BSON file inside the ZIP archive.
 * @param {OctoChemConnection} connection - Active database connection wrapper.
 * @yields {LotusEntry}
 * @returns {AsyncGenerator<LotusEntry>}
 */
export async function* parseLotuses(lotusFilePath, filename, connection) {
  try {
    let folderPath;
    if (process.env.NODE_ENV === 'test') {
      folderPath = lotusFilePath.replace(/data\/.*/, 'data/');
    } else {
      folderPath = lotusFilePath.replace(/full\/.*/, 'full/');
    }
    const fileToRead = (
      await fileCollectionFromPath(folderPath, {
        unzip: { zipExtensions: [] },
      })
    ).files.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))[0];
    // replace full/ with relative path
    if (process.env.NODE_ENV === 'test') {
      fileToRead.relativePath = folderPath.replace(
        'data/',
        fileToRead.relativePath,
      );
    } else {
      fileToRead.relativePath = folderPath.replace(
        'full/',
        fileToRead.relativePath,
      );
    }
    debug.trace('fileToRead', fileToRead);
    const readStream = await readStreamInZipFolder(
      fileToRead.relativePath,
      filename,
    );

    for await (const entry of bsonIterator(readStream)) {
      try {
        /** @type {LotusBsonEntry} */
        const bsonEntry = /** @type {any} */ (entry);
        const oclMolecule = OCL.Molecule.fromSmiles(bsonEntry.smiles);
        const ocl = await getNoStereosFromCache(
          oclMolecule,
          connection,
          'lotus',
        );
        // Parse taxonomies from all available sources
        const taxonomy = bsonEntry.taxonomyReferenceObjects;
        const key = taxonomy ? Object.keys(taxonomy)[0] : undefined;
        const taxonomySources = taxonomy && key ? taxonomy[key] : undefined;
        /** @type {LotusParsedTaxonomy[]} */
        const ncbi = [];
        /** @type {LotusParsedTaxonomy[]} */
        const gBifBackboneTaxonomy = [];
        /** @type {LotusParsedTaxonomy[]} */
        const iNaturalist = [];
        /** @type {LotusParsedTaxonomy[]} */
        const openTreeOfLife = [];
        /** @type {LotusParsedTaxonomy[]} */
        const iTIS = [];
        // Keep information of all taxonomy sources
        if (
          taxonomySources &&
          'NCBI' in taxonomySources &&
          taxonomySources.NCBI
        ) {
          for (const entry of taxonomySources.NCBI) {
            /** @type {LotusParsedTaxonomy} */
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

        if (
          taxonomySources &&
          'GBIF Backbone Taxonomy' in taxonomySources &&
          taxonomySources['GBIF Backbone Taxonomy']
        ) {
          for (const entry of taxonomySources['GBIF Backbone Taxonomy']) {
            /** @type {LotusParsedTaxonomy} */
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

        if (
          taxonomySources &&
          'iNaturalist' in taxonomySources &&
          taxonomySources.iNaturalist
        ) {
          for (const entry of taxonomySources.iNaturalist) {
            /** @type {LotusParsedTaxonomy} */
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

        if (
          taxonomySources &&
          'Open Tree of Life' in taxonomySources &&
          taxonomySources['Open Tree of Life']
        ) {
          for (const entry of taxonomySources['Open Tree of Life']) {
            /** @type {LotusParsedTaxonomy} */
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
        if (
          taxonomySources &&
          'ITIS' in taxonomySources &&
          taxonomySources.ITIS
        ) {
          for (const entry of taxonomySources.ITIS) {
            /** @type {LotusParsedTaxonomy} */
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
        // Assemble final document
        /** @type {LotusEntry} */
        const result = {
          _id: bsonEntry.lotus_id,
          data: {
            ocl,
          },
        };
        if (bsonEntry?.iupac_name) {
          result.data.iupacName = bsonEntry?.iupac_name;
        }
        /** @type {LotusRawTaxonomies} */
        const rawTaxonomies = {};
        let hasTaxonomies = false;
        if (ncbi.length !== 0) {
          rawTaxonomies.ncbi = ncbi;
          hasTaxonomies = true;
        }
        if (gBifBackboneTaxonomy.length !== 0) {
          rawTaxonomies.gBifBackboneTaxonomy = gBifBackboneTaxonomy;
          hasTaxonomies = true;
        }
        if (iNaturalist.length !== 0) {
          rawTaxonomies.iNaturalist = iNaturalist;
          hasTaxonomies = true;
        }
        if (openTreeOfLife.length !== 0) {
          rawTaxonomies.openTreeOfLife = openTreeOfLife;
          hasTaxonomies = true;
        }
        if (iTIS.length !== 0) {
          rawTaxonomies.iTIS = iTIS;
          hasTaxonomies = true;
        }
        if (hasTaxonomies) {
          result.data.taxonomies = rawTaxonomies;
        }
        yield result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        if (connection) {
          debug.warn(err.message, {
            collection: 'lotuses',
            connection,
            stack: err.stack,
          });
        }
        continue;
      }
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'lotuses',
        connection,
        stack: err.stack,
      });
    }
  }
}
