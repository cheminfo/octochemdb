import { join } from 'path';

import Debug from 'debug';
import { fileListFromPath } from 'filelist-from';
import pkg from 'fs-extra';
import unzipper from 'unzipper';

import getFileIfNew from '../../../sync/http/utils/getFileIfNew.js';

import { parseCoconut } from './utils/parseCoconut.js';

const {
  moveSync,
  rmSync,
  existsSync,
  createReadStream,
  createWriteStream,
  mkdirSync,
} = pkg;

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
  debug(`Need to decompress: ${lastFile}`);

  await new Promise((resolve, reject) => {
    createReadStream(lastFile)
      .pipe(unzipper.Parse())
      .on('entry', function (entry) {
        const fileName = entry.path;
        const type = entry.type; // 'Directory' or 'File'
        const size = entry.vars.uncompressedSize; // There is also compressedSize;
        console.log(fileName, type, size);
        if (type === 'Directory') {
          mkdirSync(join(targetFolder, fileName));
          entry.autodrain();
        } else {
          entry.pipe(createWriteStream(join(targetFolder, fileName)));
        }
      })
      .on('close', () => {
        resolve();
        console.log('close');
      });
  });

  debug('Uncompressed done');
  const modificationDate = lastFile.split('.')[3];
  const filePath = fileListFromPath(targetFolder).filter(
    (file) => file.name === 'uniqueNaturalProduct.bson',
  );

  const filename = join(
    filePath[0].name
      .replace(/^.*\//, '')
      .replace(/(\.[^.]*$)/, `.${modificationDate}$1`),
  );
  const removeFolderPath = targetFolder.concat(
    '/',
    filePath[0].webkitRelativePath.split('/')[4],
  );

  if (!existsSync(join(targetFolder, filename))) {
    moveSync(filePath[0].webkitRelativePath, join(targetFolder, filename));
    rmSync(join(removeFolderPath), { recursive: true });
  }
  // we reparse all the file and skip if required
  const source = lastFile.replace(process.env.ORIGINAL_DATA_PATH, '');
  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();

  const coconut = await parseCoconut(join(targetFolder, filename));

  for (const entry of coconut) {
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
