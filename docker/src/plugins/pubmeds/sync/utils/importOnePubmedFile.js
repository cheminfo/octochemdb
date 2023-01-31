import { rmSync } from 'fs';
import { open } from 'fs/promises';

import { parseStream } from 'arraybuffer-xml-parser';

import debugLibrary from '../../../../utils/Debug.js';

import { decompressGziped } from './decompressGziped.js';
import { improvePubmed } from './improvePubmed.js';
/**
 * @description  import one PubMed file
 * @param {*} connection  - mongo connection
 * @param {*} progress - pubmeds progress
 * @param {Array} file - file to import
 * @param {object} options - options { shouldImport ,lastDocument }
 * @param {object} pmidToCid - pmid to cid map
 * @returns {Promise} pubmeds collection
 */
export default async function importOnePubmedFile(
  connection,
  progress,
  file,
  options,
  pmidToCid,
) {
  const debug = debugLibrary('importOnePubmedFile');
  try {
    // get pubmeds collection
    const collection = await connection.getCollection('pubmeds');
    debug(`Importing: ${file.name}`);
    // get logs
    const logs = await connection.getImportationLog({
      collectionName: 'pubmeds',
      sources: file.name,
      startSequenceID: progress.seq,
    });
    // create stream from file
    const filePath = await decompressGziped(file.path);
    const fileStream = await open(filePath, 'r');
    const readableStream = fileStream.readableWebStream();
    let { shouldImport, lastDocument } = options;
    let imported = 0;
    debug(`Importing ${file.name}`);
    // parse the pubmed file stream
    for await (const entry of parseStream(readableStream, 'PubmedArticle')) {
      if (!shouldImport) {
        if (entry.MedlineCitation.PMID['#text'] !== lastDocument._id) {
          continue;
        }
        shouldImport = true;
        debug(`Skipping pubmeds till: ${lastDocument._id}`);
        continue;
      }
      if (shouldImport) {
        let result = await improvePubmed(entry, pmidToCid);
        imported++;
        result._seq = ++progress.seq;
        // insert entry into pubmeds collection
        await collection.updateOne(
          { _id: result._id },
          { $set: result },
          { upsert: true },
        );
      }
    }
    // set logs and progress
    progress.sources = file.path.replace(process.env.ORIGINAL_DATA_PATH, '');
    await connection.setProgress(progress);
    logs.dateEnd = Date.now();
    logs.endSequenceID = progress.seq;
    logs.status = 'updated';
    await connection.updateImportationLog(logs);
    debug(`${imported} articles processed`);
    // Remove the decompressed gzip file after it has been imported
    await fileStream.close();
    rmSync(filePath, { recursive: true });
    return imported;
  } catch (err) {
    debug(err, { collection: 'pubmeds', connection });
  }
}