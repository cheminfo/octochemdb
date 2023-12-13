import fs from 'fs';
import zlib from 'zlib';

import { parse } from 'sdf-parser';

import debugLibrary from '../../../../utils/Debug.js';

import improveCompoundPool from './improveCompoundPool.js';

const debug = debugLibrary('importOneCompoundFile');
/**
 * @description import compounds from a PubChem Compound file
 * @param {*} connection MongoDB connection
 * @param {*} progress import progress
 * @param {*} file file to import
 * @param {*} options options {shouldImport: boolean, lastDocument: object}
 * @returns {Promise} returns entries in compounds collections
 */
export default async function importOneCompoundFile(
  connection,
  progress,
  file,
  options,
) {
  // get compounds collection
  const collection = await connection.getCollection('compounds');
  debug.trace(`Importing: ${file.name}`);

  // should we directly import the data or wait that we reach the previously imported information
  let { shouldImport = true, lastDocument } = options;
  // Create a readStream for the file
  let bufferValue = '';
  let newCompounds = 0;
  const readStream = fs.createReadStream(file.path);
  const unzipStream = readStream.pipe(zlib.createGunzip());
  for await (const chunk of unzipStream) {
    bufferValue += chunk;
    if (bufferValue.length < 128 * 1024 * 1024) continue;
    let lastIndex = bufferValue.lastIndexOf('$$$$');
    if (lastIndex > 0 && lastIndex < bufferValue.length - 5) {
      // eslint-disable-next-line require-atomic-updates
      newCompounds += await parseSDF(bufferValue.substring(0, lastIndex + 5));
      bufferValue = bufferValue.substring(lastIndex + 5);
    }
  }

  // parse the last chunk
  // eslint-disable-next-line require-atomic-updates
  newCompounds += await parseSDF(bufferValue);

  debug.trace(`${newCompounds} compounds imported from ${file.name}`);
  // return the new compounds count
  return newCompounds;

  // parse the SDF file (function called in line 50) and import the compounds in the compounds collection
  async function parseSDF(sdf) {
    // parse the SDF file
    let compounds = parse(sdf).molecules;
    debug.trace(`Need to process ${compounds.length} compounds`);
    // the array action will contain the promises to be resolved
    let start = Date.now();
    for (const compound of compounds) {
      // skip till CID corresponds to the last document imported ID
      if (!shouldImport) {
        if (compound.PUBCHEM_COMPOUND_CID !== lastDocument._id) {
          continue;
        }
        shouldImport = true;
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(`Skipping compounds till: ${lastDocument._id}`);
          start = Date.now();
          continue;
        }
      }
      try {
        const { promise } = await improveCompoundPool(compound);
        if (process.env.NODE_ENV === 'test') {
          await promise
            .then((result) => {
              if (result === undefined) {
                return;
              }
              if (result) {
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
        }
      } catch (e) {
        if (connection) {
          await debug.fatal(e.message, {
            collection: 'compounds',
            connection,
            stack: e.stack,
          });
        }
        continue;
      }
      newCompounds++;
    }

    debug.trace(`${newCompounds} compounds processed`);
    return compounds.length;
  }
}
