/* eslint-disable no-inner-declarations */
import fs from 'fs';
import zlib from 'zlib';

import { parse } from 'sdf-parser';

import debugLibrary from '../../../../utils/Debug.js';

import { getTaxonomiesSubstances } from './getTaxonomiesSubstances.js';
import improveSubstancePool from './improveSubstancePool.js';

/**
 * Import a single gzipped SDF substance file into MongoDB.
 *
 * The file is streamed and decompressed in chunks of ~128 MB.  Each chunk
 * is split on the `$$$$` SDF record separator and parsed.  Every parsed
 * substance is sent to the thread-pool via {@link improveSubstancePool},
 * and the resulting promise is resolved (in test mode) or fire-and-forget
 * (in production) before upserting the enriched document.
 *
 * @param {OctoChemConnection} connection - MongoDB connection wrapper
 * @param {object} progress - progress document for the substances collection
 * @param {{name: string, path: string}} file - substance SDF file descriptor
 * @param {object} options - import options (`shouldImport`, `lastDocument`)
 * @returns {Promise<number|undefined>} number of substances imported
 */
export default async function importOneSubstanceFile(
  connection,
  progress,
  file,
  options,
) {
  const debug = debugLibrary('improveOneSubstanceFile');
  try {
    const collection = await connection.getCollection('substances');

    const collectionTaxonomies = await connection.getCollection('taxonomies');

    debug.info(`Importing taxonomies collection`);
    // Determine whether to skip ahead to the last-imported document
    let { shouldImport = true, lastDocument } = options;
    let bufferValue = '';
    let newSubstances = 0;
    const readStream = fs.createReadStream(file.path);
    const unzipStream = readStream.pipe(zlib.createGunzip());
    for await (const chunk of unzipStream) {
      bufferValue += chunk;
      // Accumulate at least 128 MB before parsing to reduce SDF-parser overhead
      if (bufferValue.length < 128 * 1024 * 1024) continue;
      const lastIndex = bufferValue.lastIndexOf('$$$$');
      if (lastIndex > 0 && lastIndex < bufferValue.length - 5) {
        // eslint-disable-next-line require-atomic-updates
        newSubstances += await parseSDF(
          bufferValue.substring(0, lastIndex + 5),
        );
        bufferValue = bufferValue.substring(lastIndex + 5);
      }
    }
    // Process any remaining SDF content after the stream ends
    // eslint-disable-next-line require-atomic-updates
    newSubstances += await parseSDF(bufferValue);

    debug.trace(`${newSubstances} substances imported from ${file.name}`);
    return newSubstances;

    async function parseSDF(sdf) {
      let substances = parse(sdf).molecules;
      debug.trace(`Need to process ${substances.length} substances`);

      if (process.env.NODE_ENV === 'test') substances = substances.slice(0, 10);

      for (const substance of substances) {
        if (!shouldImport) {
          if (substance.PUBCHEM_SUBSTANCE_ID !== lastDocument._id) {
            continue;
          }
          shouldImport = true;
          debug.trace(`Skipping substances till: ${lastDocument._id}`);
          continue;
        }
        try {
          const { promise } = await improveSubstancePool(substance);
          if (process.env.NODE_ENV === 'test') {
            await promise
              .then((result) => {
                if (result) {
                  if (result === undefined) {
                    return;
                  }
                  if (result.data.taxonomyIDs) {
                    result = getTaxonomiesSubstances(
                      result,
                      collectionTaxonomies,
                    );
                  }
                  result._seq = ++progress.seq;
                  return collection.updateOne(
                    { _id: result._id },
                    { $set: result },
                    { upsert: true },
                  );
                }
              })
              .then(() => {
                progress.sources = file.path.replace(
                  process.env.ORIGINAL_DATA_PATH,
                  '',
                );
                progress.dateEnd = Date.now();
                return connection.setProgress(progress);
              });
          } else {
            // In production, fire-and-forget: do not await the upsert promise
            promise
              .then((result) => {
                if (result === undefined) {
                  return;
                }
                if (result) {
                  if (result.data.taxonomyIDs) {
                    result = getTaxonomiesSubstances(
                      result,
                      collectionTaxonomies,
                    );
                  }
                  result._seq = ++progress.seq;
                  return collection.updateOne(
                    { _id: result._id },
                    { $set: result },
                    { upsert: true },
                  );
                }
              })
              .then(() => {
                progress.sources = file.path.replace(
                  process.env.ORIGINAL_DATA_PATH,
                  '',
                );
                return connection.setProgress(progress);
              });
          }
        } catch (e) {
          const err = e instanceof Error ? e : new Error(String(e));
          if (connection) {
            debug.warn(err.message, {
              collection: 'substances',
              connection,
              stack: err.stack,
            });
          }
          continue;
        }
        newSubstances++;
      }

      debug.trace(`${newSubstances} substances processed`);
      return substances.length;
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'substances',
        connection,
        stack: err.stack,
      });
    }
  }
}
