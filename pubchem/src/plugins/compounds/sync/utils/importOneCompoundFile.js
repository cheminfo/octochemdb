import fs from 'fs';
import zlib from 'zlib';

import { parse } from 'sdf-parser';

import Debug from '../../../../utils/Debug.js';

import improveCompoundPool from './improveCompoundPool.js';

const debug = Debug('importOneCompoundFile');

export default async function importOneCompoundFile(
  connection,
  progress,
  file,
  options,
) {
  const collection = await connection.getCollection('compounds');
  debug(`Importing: ${file.name}`);
  // should we directly import the data how wait that we reach the previously imported information
  let { shouldImport = true, lastDocument } = options;
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
  newCompounds += await parseSDF(bufferValue);
  debug(`${newCompounds} compounds imported from ${file.name}`);
  return newCompounds;

  async function parseSDF(sdf) {
    let compounds = parse(sdf).molecules;
    debug(`Need to process ${compounds.length} compounds`);

    if (process.env.TEST === 'true') compounds = compounds.slice(0, 10);

    const actions = [];
    let start = Date.now();
    for (const compound of compounds) {
      if (!shouldImport) {
        if (compound.PUBCHEM_COMPOUND_CID !== lastDocument._id) {
          continue;
        }
        shouldImport = true;
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug(`Skipping compounds till: ${lastDocument._id}`);
          start = Date.now();
          continue;
        }
      }

      actions.push(
        improveCompoundPool(compound)
          .then((result) => {
            result._seq = ++progress.seq;
            result._source = file.path.replace(
              process.env.ORIGINAL_DATA_PATH,
              '',
            );
            return collection.updateOne(
              { _id: result._id },
              { $set: result },
              { upsert: true },
            );
          })
          .then(() => {
            return connection.setProgress(progress);
          }),
      );
    }
    newCompounds += actions.length;
    await Promise.all(actions);
    debug(`${newCompounds} compounds processed`);
    // save the compounds in the database
    return compounds.length;
  }
}
