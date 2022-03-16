import { readFileSync } from 'fs';

import Debug from 'debug';

import { npAtlasParser } from './npAtlasParser.js';

const debug = Debug('importOneNpatlasFile');

export default async function importOneNpatlasFile(
  connection,
  progress,
  file,
  options,
) {
  const collection = await connection.getCollection('npAtlas');

  debug(`Importing: ${file.name}`);
  // should we directly import the data how wait that we reach the previously imported information
  let { shouldImport = true, lastDocument } = options;

  const fileList = readFileSync(file.path, 'utf8').filter(
    (file) => file.name === 'NPAtlas_download.json',
  );

  let counter = 0;
  let imported = 0;
  for await (const taxonomy of npAtlasParser(JSON.parse(fileList))) {
    if (process.env.TEST === 'true' && counter++ > 20) break;
    if (!shouldImport) {
      if (taxonomy.ocl.id !== lastDocument._id) {
        continue;
      }
      debug(`Skipping molecule till: ${lastDocument._id}`);
      continue;
    }
    shouldImport = true;
    taxonomy._seq = ++progress.seq;
    taxonomy._source = file.path.replace(process.env.ORIGINAL_DATA_PATH, '');
    await collection.updateOne(
      { _id: taxonomy.ocl.id },
      { $set: taxonomy },
      { upsert: true },
    );
    await connection.setProgress(progress);
    imported++;
  }

  debug(`${imported} molecules imported`);
}
