import { join } from 'path';

import Debug from 'debug';
import pkg from 'fs-extra';
import unzipper from 'unzipper';

import getFileIfNew from '../../../sync/http/utils/getFileIfNew.js';

import { parseCoconut } from './utils/parseCoconut.js';

const { rmSync, existsSync, createReadStream, createWriteStream } = pkg;

const debug = Debug('syncCoconut');

export async function sync(connection) {
  const lastFile = await getLastCoconutFile();
  const progress = await connection.getProgress('coconut');
  const collection = await connection.getCollection('coconut');
  const lastDocumentImported = await getLastCoconutCompoundImported(
    connection,
    progress,
  );
  debug(`lastDocumentImported: ${JSON.stringify(lastDocumentImported)}`);
  let firstID;
  if (
    lastDocumentImported &&
    lastDocumentImported._source &&
    lastFile.includes(lastDocumentImported._source)
  ) {
    firstID = lastDocumentImported._id;
  }
  const targetFolder = `${process.env.ORIGINAL_DATA_PATH}/coconut/full`;
  const modificationDate = lastFile.split('.')[3];
  const updatedFileName = join(
    'uniqueNaturalProduct.bson'
      .replace(/^.*\//, '')
      .replace(/(\.[^.]*$)/, `.${modificationDate}$1`),
  );
  debug(`Need to decompress: ${lastFile}`);

  await new Promise((resolve) => {
    createReadStream(lastFile)
      .pipe(unzipper.Parse())
      .on('entry', function (entry) {
        const fileName = entry.path;
        const type = entry.type; // 'Directory' or 'File'
        const regex = new RegExp('uniqueNaturalProduct.bson');
        if (type === 'File' && regex.test(fileName)) {
          if (!existsSync(join(targetFolder, updatedFileName))) {
            entry.pipe(createWriteStream(join(targetFolder, updatedFileName)));
          }
        } else {
          entry.autodrain();
        }
      })
      .on('close', () => {
        resolve();
        console.log('close');
      });
  });

  debug('Uncompressed done');

  // we reparse all the file and skip if required
  const source = lastFile.replace(process.env.ORIGINAL_DATA_PATH, '');
  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();

  for await (const entry of parseCoconut(join(targetFolder, updatedFileName))) {
    counter++;
    if (process.env.TEST === 'true' && counter > 20) break;
    if (Date.now() - start > 10000) {
      debug(`Processing: counter: ${counter} - imported: ${imported}`);
      start = Date.now();
    }
    if (skipping) {
      if (firstID === entry._id) {
        skipping = false;
        debug(`Skipping compound till:${firstID}`);
      }
      continue;
    }
    entry._seq = ++progress.seq;
    entry._source = source;
    await collection.updateOne(
      { _id: entry._id },
      { $set: entry },
      { upsert: true },
    );
    await connection.setProgress(progress);
    imported++;
  }
  debug(`${imported} compounds processed`);

  // we remove all the entries that are not imported by the last file
  const result = await collection.deleteMany({
    _source: { $ne: source },
  });
  debug(`Deleting entries with wrong source: ${result.deletedCount}`);
  if (existsSync(join(targetFolder, updatedFileName))) {
    rmSync(join(targetFolder, updatedFileName), { recursive: true });
  }
}

async function getLastCoconutCompoundImported(connection, progress) {
  const collection = await connection.getCollection('coconut');
  return collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();
}

async function getLastCoconutFile() {
  debug('Get last coconut file if new');

  const source = process.env.COCONUT_SOURCE;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/coconut/full`;

  debug(`Syncing: ${source} to ${destination}`);

  return getFileIfNew({ url: source }, destination, {
    filename: 'coconut',
    extension: 'zip',
  });
}
