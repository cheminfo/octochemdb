/* eslint-disable no-inner-declarations */
import fs from 'fs';
import zlib from 'zlib';

import { parse } from 'sdf-parser';

import debugLibrary from '../../../../utils/Debug.js';

import { getTaxonomiesSubstances } from './getTaxonomiesSubstances.js';
import improveSubstancePool from './improveSubstancePool.js';
/**
 * @description import one substance file
 * @param {*} connection connection to mongo
 * @param {*} progress substances progress
 * @param {*} file substance file
 * @param {*} options {shouldImport:boolean,lastDocument:object}
 * @returns {Promise} substances imported
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
    // should we directly import the data how wait that we reach the previously imported information
    let { shouldImport = true, lastDocument } = options;
    let bufferValue = '';
    let newSubstances = 0;
    const readStream = fs.createReadStream(file.path);
    const unzipStream = readStream.pipe(zlib.createGunzip());
    for await (const chunk of unzipStream) {
      bufferValue += chunk;
      if (bufferValue.length < 128 * 1024 * 1024) continue;
      let lastIndex = bufferValue.lastIndexOf('$$$$');
      if (lastIndex > 0 && lastIndex < bufferValue.length - 5) {
        // eslint-disable-next-line require-atomic-updates
        newSubstances += await parseSDF(
          bufferValue.substring(0, lastIndex + 5),
        );
        bufferValue = bufferValue.substring(lastIndex + 5);
      }
    }
    // eslint-disable-next-line require-atomic-updates
    newSubstances += await parseSDF(bufferValue);

    debug.trace(`${newSubstances} substances imported from ${file.name}`);
    return newSubstances;

    async function parseSDF(sdf) {
      let substances = parse(sdf).molecules;
      debug.trace(`Need to process ${substances.length} substances`);

      if (process.env.NODE_ENV === 'test') substances = substances.slice(0, 10);

      for (let substance of substances) {
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
          if (connection) {
            debug.warn(e.message, {
              collection: 'substances',
              connection,
              stack: e.stack,
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
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'substances',
        connection,
        stack: e.stack,
      });
    }
  }
}
