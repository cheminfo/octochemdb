import pkg from 'fs-extra';
import gunzipStream from './utils/gunzipStream.js';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import { parseRelations } from './utils/parseRelations.js';

const { rmSync, existsSync } = pkg;

const debug = Debug('syncRelations');

export async function sync(connection) {
  let options = {
    collectionSource: process.env.PMIDTOCID_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/relations/full`,
    collectionName: 'relations',
    filenameNew: 'pmidTocid',
    extensionNew: 'gz',
  };
  const cidTopmid = await getLastFileSync(options);
  options.filenameNew = 'cidTopatent';
  options.collectionSource = process.env.CIDTOPATENT_SOURCE;
  const cidTopatent = await getLastFileSync(options);
  options.filenameNew = 'cidTosid';
  options.collectionSource = process.env.CIDTOSID_SOURCE;
  const cidTosid = await getLastFileSync(options);
  const progress = await connection.getProgress(options.collectionName);
  const collection = await connection.getCollection(options.collectionName);

  const source = [
    cidTopmid.replace(process.env.ORIGINAL_DATA_PATH, ''),
    cidTopatent.replace(process.env.ORIGINAL_DATA_PATH, ''),
    cidTosid.replace(process.env.ORIGINAL_DATA_PATH, ''),
  ];
  const newFiles = [cidTopmid, cidTopatent, cidTosid];

  const lastDocumentImported = await getLastDocumentImported(
    connection,
    progress,
    options.collectionName,
  );
  let oldSource;
  if (lastDocumentImported !== null) {
    oldSource = lastDocumentImported._source;
  } else {
    oldSource = [' '];
  }

  let status = false;
  for (let i = 0; i < newFiles.length; i++) {
    if (newFiles[i].includes(oldSource[i])) status = true;
    if (!status) break;
  }
  let cidTopmidPath = await gunzipStream(cidTopmid, cidTopmid.split('.gz')[0]);
  let cidTopatentPath = await gunzipStream(
    cidTopatent,
    cidTopatent.split('.gz')[0],
  );
  let cidTosidPath = await gunzipStream(cidTosid, cidTosid.split('.gz')[0]);
  let firstID;
  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();
  if (
    lastDocumentImported === null ||
    !status ||
    progress.state !== 'updated'
  ) {
    if (progress.state === 'updated') {
      debug('Droped old collection');
      await connection.dropCollection('coconut');
      progress.state = 'updating';
      await connection.setProgress(progress);
    }
    debug(`Start parsing relations`);
    if (
      lastDocumentImported &&
      lastDocumentImported._source &&
      cidTosid.includes(lastDocumentImported._source)
    ) {
      firstID = lastDocumentImported._id;
    }
    for await (const entry of parseRelations(
      cidTopmidPath,
      cidTosidPath,
      cidTopatentPath,
    )) {
      counter++;
      if (process.env.TEST === 'true' && counter > 20) break;
      if (skipping && progress.state !== 'updated') {
        if (firstID === entry._id) {
          skipping = false;
          debug(`Skipping compound till:${firstID}`);
        }
        continue;
      }
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
        debug(`Processing: counter: ${counter} - imported: ${imported}`);
        start = Date.now();
      }

      entry._seq = ++progress.seq;
      entry._source = source;
      progress.state = 'updating';
      await collection.updateOne(
        { _id: entry._id },
        { $set: entry },
        { upsert: true },
      );
      await connection.setProgress(progress);
      imported++;
    }
    progress.date = new Date();
    progress.state = 'updated';
    await connection.setProgress(progress);
    debug(`${imported} compounds processed`);
  } else {
    debug(`file already processed`);
  }
  // we remove all the entries that are not imported by the last file
  if (existsSync(cidTopmidPath)) {
    rmSync(cidTopmidPath, { recursive: true });
  }

  if (existsSync(cidTosidPath)) {
    rmSync(cidTosidPath, { recursive: true });
  }
  if (existsSync(cidTopatentPath)) {
    rmSync(cidTopatentPath, { recursive: true });
  }
}
