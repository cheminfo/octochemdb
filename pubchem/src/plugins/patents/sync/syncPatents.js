import { join } from 'path';

import pkg from 'fs-extra';

import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import calculateDiff from './utils/calculateDiff.js';
import { getLatestsImportedFile } from './utils/getLatestsImportedFile.js';
import parsePatents from './utils/parsePatents.js';
import ungzipAndSort from './utils/ungzipAndSort.js';

const { removeSync, existsSync, unlinkSync, linkSync } = pkg;
/**
 * @description sync patents from PubChem database
 * @param {*} connection - mongo connection
 * @returns {Promise} returns patents collection
 */
export async function sync(connection) {
  const debug = Debug('syncPatents');
  try {
    let options = {
      collectionSource: process.env.CIDTOPATENTS_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/patents/cidToPatents`,
      collectionName: 'patents',
      filenameNew: 'cidToPatents',
      extensionNew: 'gz',
    };
    const collection = await connection.getCollection(options.collectionName);

    // get last files cidToPatens available in the PubChem database
    const lastFile = await getLastFileSync(options);
    // sort file by cid
    const sortedFile = `${lastFile.split('.gz')[0]}.sorted`;
    await ungzipAndSort(lastFile, sortedFile);
    // remove non-sorted file
    removeSync(lastFile);
    const lastImportedFilePath = await getLatestsImportedFile(
      `${options.destinationLocal}/old`,
      'cidToPatents',
    );
    if (lastImportedFilePath !== null) {
      const filenames = await createDiffFromLastTwoFiles(
        lastImportedFilePath,
        sortedFile,
      );
      let success = await parsePatents(
        filenames.diffFile,
        collection,
        connection,
      );
      if (success) {
        if (existsSync(filenames.previousFile)) {
          unlinkSync(filenames.previousFile);
        }
        linkSync(filenames.lastFile, filenames.previousFile);
      }
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'npAtlases', connection, stack: e.stack });
    }
  }
}

async function createDiffFromLastTwoFiles(newFileToImport, lastImportedFile) {
  const lastFile = join(newFileToImport);
  let previousFile = join(lastImportedFile);
  let currentPreviousFile = existsSync(previousFile)
    ? previousFile
    : '/dev/null';

  let diffFile = lastFile.replace('.sorted', '.diff');
  await calculateDiff(currentPreviousFile, lastFile, diffFile);
  return {
    currentPreviousFile,
    lastFile,
    previousFile,
    diffFile,
  };
}
