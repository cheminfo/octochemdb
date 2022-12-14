import fs from 'fs';
import zlib from 'zlib';

import { parse } from 'sdf-parser';

import Debug from '../../../../utils/Debug.js';

import improveCompoundPool from './improveCompoundPool.js';

const debug = Debug('importOneCompoundFile');
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
  debug(`Importing: ${file.name}`);
  // Get logs collection
  const logs = await connection.getImportationLog({
    collectionName: 'compounds',
    sources: file.name,
    startSequenceID: progress.seq,
  });
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
      newCompounds += await parseSDF(bufferValue.substring(0, lastIndex + 5));
      bufferValue = bufferValue.substring(lastIndex + 5);
    }
  }
  // parse the last chunk
  newCompounds += await parseSDF(bufferValue);
  // update logs
  logs.dateEnd = Date.now();
  logs.endSequenceID = progress.seq;
  logs.status = 'updated';
  await connection.updateImportationLog(logs);
  debug(`${newCompounds} compounds imported from ${file.name}`);
  // return the new compounds count
  return newCompounds;

  // parse the SDF file (function called in line 50) and import the compounds in the compounds collection
  async function parseSDF(sdf) {
    // parse the SDF file
    let compounds = parse(sdf).molecules;
    debug(`Need to process ${compounds.length} compounds`);
    // if test mode is enabled, we only process the first 10 compounds
    if (process.env.TEST === 'true') compounds = compounds.slice(0, 10);
    // the array action will contain the promises to be resolved
    const actions = [];
    let start = Date.now();
    for (const compound of compounds) {
      // skip till CID corresponds to the last document imported ID
      if (!shouldImport) {
        if (compound.PUBCHEM_COMPOUND_CID !== lastDocument._id) {
          continue;
        }
        shouldImport = true;
        if (
          Date.now() - start >
          Number(process.env.DEBUG_THROTTLING || 10000)
        ) {
          debug(`Skipping compounds till: ${lastDocument._id}`);
          start = Date.now();
          continue;
        }
      }
      try {
        // promises to be resolved
        actions.push(
          improveCompoundPool(compound)
            .then((result) => {
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
              return connection.setProgress(progress);
            }),
        );
        if (actions.length > 20) {
          newCompounds += actions.length;
          await Promise.all(actions);
          actions.length = 0;
        }
      } catch (e) {
        if (connection) {
          debug(e.message, {
            collection: 'compounds',
            connection,
            stack: e.stack,
          });
        }
        continue;
      }
    }

    newCompounds += actions.length;
    // wait for all the promises to be resolved
    await Promise.all(actions);

    debug(`${newCompounds} compounds processed`);
    return compounds.length;
  }
}
