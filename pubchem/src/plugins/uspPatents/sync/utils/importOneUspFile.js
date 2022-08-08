/**
 * @description Parses the USP XML and returns a JSON object.
 * @param {string} xmlPath - The path to USP XML.
 * @returns {object} - The JSON object.
 */

import { open } from 'fs/promises';

import { parseStream } from 'arraybuffer-xml-parser';

import Debug from '../../../../utils/Debug.js';

import { parseUsp } from './parseUsp.js';
import { unzipFile } from './unzip.js';

const debug = Debug('importOnePubmedFile');

export async function importOneUspFile(connection, progress, file, options) {
  try {
    const collection = await connection.getCollection('uspPatents');
    const progress = connection.getProgress('uspPatents');
    // unzip file and get xmlpath

    const xmlPath = await unzipFile(file.path);
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let imported = 0;
    const fileName = xmlPath.split('/')[xmlPath.split('/').length - 1];
    // get last element of array
    debug(`Importing: ${fileName}`);

    const logs = await connection.getImportationLog({
      collectionName: 'uspPatents',
      sources: fileName,
      startSequenceID: progress.seq,
    });
    let { shouldImport, lastDocument } = options;

    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      let results = await parseUsp(entry);
      if (!shouldImport) {
        if (results._id !== lastDocument._id) {
          continue;
        }
        shouldImport = true;
        debug(`Skipping patents till: ${lastDocument._id}`);
        continue;
      }
      if (shouldImport) {
        imported++;
        results._seq = ++progress.seq;
        await collection.updateOne(
          { _id: results._id },
          { $set: results },
          { upsert: true },
        );
      }
    }
    progress.sources = xmlPath.replace(process.env.ORIGINAL_DATA_PATH, '');
    await connection.setProgress(progress);
    logs.dateEnd = Date.now();
    logs.endSequenceID = progress.seq;
    logs.status = 'updated';
    await connection.updateImportationLog(logs);
    debug(`${imported} articles processed`);
    // Remove the decompressed gzip file after it has been imported
    await fileStream.close();
    return imported;
  } catch (err) {
    debug(err, { collection: 'uspPatents', connection });
  }
}
