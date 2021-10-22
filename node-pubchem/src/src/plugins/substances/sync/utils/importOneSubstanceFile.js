import fs from 'fs';
import zlib from 'zlib';

import Debug from 'debug';
import { parse } from 'sdf-parser';

import improveSubstance from './improveSubstance.js';

const debug = Debug('improveOneSubstanceFile');

export default async function importOneSubstanceFile(
  connection,
  progress,
  file,
  options,
) {
  const collection = await connection.getCollection('substances');

  debug(`Importing: ${file.name}`);
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
      newSubstances += await parseSDF(bufferValue.substring(0, lastIndex + 5));
      bufferValue = bufferValue.substring(lastIndex + 5);
    }
  }
  newSubstances += await parseSDF(bufferValue);
  debug(`${newSubstances} substances imported from ${file.name}`);
  return newSubstances;

  async function parseSDF(sdf) {
    let substances = parse(sdf).molecules;
    debug(`Need to process ${substances.length} substances`);

    if (process.env.TEST === 'true') substances = substances.slice(0, 10);
    let imported = 0;
    for (let substance of substances) {
      if (!shouldImport) {
        if (substance.PUBCHEM_COMPOUND_CID !== lastDocument._id) {
          continue;
        }
        shouldImport = true;
        debug(`Skipping substances till: ${lastDocument._id}`);
        continue;
      }

      substance = improveSubstance(substance);

      substance._seq = ++progress.seq;
      substance._source = file.path.replace(process.env.ORIGINAL_DATA_PATH, '');
      await collection.updateOne(
        { _id: substance._id },
        { $set: substance },
        { upsert: true },
      );
      connection.setProgress(progress);
      imported++;
    }
    debug(`${imported} substances processed`);
    // save the substances in the database
    return substances.length;
  }
}
