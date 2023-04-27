import { existsSync, rmSync } from 'fs';
import { open } from 'fs/promises';

import { parseStream } from 'arraybuffer-xml-parser';

import debugLibrary from '../../../../utils/Debug.js';

import { parsers } from './parsers/parsers.js';
import { unzipFile } from './unzip.js';

const debug = debugLibrary('importOneUspFile');

export async function importOneUspFile(connection, progress, file, options) {
  try {
    const collection = await connection.getCollection('uspPatents');
    let xmlPath;
    // unzip file and get xmlpath
    if (file.path.endsWith('.xml')) {
      xmlPath = file.path;
    } else {
      xmlPath = await unzipFile(file.path);
    }

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
    // regex to get year from filename starting from 2001
    let year;
    if (process.env.NODE_ENV === 'test') {
      year = fileName.match(/^(?<temp1>[2][0][0-9][0-9])/);
    } else {
      year = fileName.split('.')[1].match(/20\d\d/);
    }
    if (year.length > 0) {
      year = Number(year[0]);
    } else {
      throw new Error('Year not found in filename');
    }

    let header;

    if (year < 2005 || year === 2006) {
      header = 'patent-application-publication';
    } else {
      header = 'us-patent-application';
    }
    let start = Date.now();
    for await (const entry of parseStream(readableStream, header)) {
      let results = await parsers(entry, year);
      if (!shouldImport) {
        if (results?._id !== lastDocument._id) {
          continue;
        }
        shouldImport = true;
        debug(`Skipping patents till: ${lastDocument._id}`);
        continue;
      }
      if (shouldImport) {
        imported++;
        if (!results) {
          continue;
        }
        if (Date.now() - start > 10000) {
          debug(`imported: ${imported} patents`);
          start = Date.now();
        }

        await collection.updateOne(
          { _id: results?._id },
          { $set: results },
          { upsert: true },
        );
      }
    }
    progress.sources = xmlPath.replace(`${process.env.ORIGINAL_DATA_PATH}`, '');
    await connection.setProgress(progress);
    logs.dateEnd = Date.now();
    logs.endSequenceID = progress.seq;
    logs.status = 'updated';
    await connection.updateImportationLog(logs);
    // Remove the decompressed gzip file after it has been imported
    await fileStream.close();
    if (existsSync(xmlPath) && process.env.NODE_ENV !== 'test') {
      rmSync(xmlPath, { recursive: true });
    }
    return imported;
  } catch (err) {
    debug(err, { collection: 'uspPatents', connection });
  }
}
