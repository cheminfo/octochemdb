import { readFileSync } from 'fs';
import pkg from 'fs-extra';
import { gunzipSync } from 'zlib';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';
import { unzipOneFile } from '../../../utils/unzipOneFile.js';

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
  const pmidTocid = await getLastFileSync(options);
  options.filenameNew = 'cidTopatent';
  options.collectionSource = process.env.CIDTOPATENT_SOURCE;
  const cidTopatent = await getLastFileSync(options);
  options.filenameNew = 'cidTosid';
  options.collectionSource = process.env.CIDTOSID_SOURCE;
  const cidTosid = await getLastFileSync(options);
  const progress = await connection.getProgress(options.collectionName);
  const collection = await connection.getCollection(options.collectionName);

  const source = [
    pmidTocid.replace(process.env.ORIGINAL_DATA_PATH, ''),
    cidTopatent.replace(process.env.ORIGINAL_DATA_PATH, ''),
    cidTosid.replace(process.env.ORIGINAL_DATA_PATH, ''),
  ];
  const newFiles = [pmidTocid, cidTopatent, cidTosid];

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
  let firstID;
  if (
    lastDocumentImported &&
    lastDocumentImported._source &&
    pmidTocid.includes(lastDocumentImported._source)
  ) {
    firstID = lastDocumentImported._id;
  }
}
