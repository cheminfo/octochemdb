import { join } from 'path';

import { fileCollectionFromPath } from 'filelist-utils';
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import syncFolder from '../../../sync/http/utils/syncFolder.js';
import debugLibrary from '../../../utils/Debug.js';

import { decompressAll } from './utils/decompressAll.js';
import { main } from './utils/main.js';

const debug = debugLibrary('syncBioassaysPubChem');
export async function sync(connection) {
  let options = {
    collectionSource: process.env.BIOASSAYSPUBMECHEM_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/bioassaysPubChem/full`,
    collectionName: 'bioassaysPubChem',
  };
  try {
    const progress = await connection.getProgress(options.collectionName);
    let sources = [];
    if (process.env.NODE_ENV === 'test') {
      sources = [`${process.env.BIOASSAYSPUBMECHEM_SOURCE_TEST}`];
    } else {
      const { allFiles } = await syncFolder(
        options.collectionSource,
        options.destinationLocal,
        {
          fileFilter: (file) => file && file.name.endsWith('.zip'),
        },
      );
      if (allFiles.length > 0) {
        allFiles.forEach((file) => {
          sources.push(file?.path);
        });
      }
    }
    let isTimeToUpdate = false;
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd >
        Number(process.env.BIOASSAYPUBCHEM_UPDATE_INTERVAL) &&
      md5(JSON.stringify(sources)) !== progress.sources
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
      isTimeToUpdate = true;
    }

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );

    if (
      lastDocumentImported === null ||
      ((md5(JSON.stringify(sources)) !== progress.sources ||
        progress.state !== 'updated') &&
        isTimeToUpdate)
    ) {
      let sourceFiles = options.destinationLocal;
      if (process.env.NODE_ENV === 'test') {
        sourceFiles = process.env.BIOASSAYSPUBMECHEM_SOURCE_TEST || '';
      }
      let fileList = await fileCollectionFromPath(sourceFiles, {
        unzip: { zipExtensions: [] },
        ungzip: { gzipExtensions: [] },
      });
      let jsonFilesPaths = [];
      for (let file of fileList.files) {
        const newJsonFilesPaths = await decompressAll(
          join(sourceFiles, file.name),
        );
        jsonFilesPaths = [...newJsonFilesPaths, ...jsonFilesPaths];
      }
      // Generate Logs for the sync
      const logs = await connection.getImportationLog({
        collectionName: options.collectionName,
        sources,
        startSequenceID: progress.seq,
      });
      // set progress to updating, if fail importation, a new try will be done 24h later
      progress.state = 'updating';
      await connection.setProgress(progress);

      /// Start import
      await main(jsonFilesPaths);
      ///
      // Temporary collection to store the new data
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      // Once it is finished, the temporary collection replace the old collection
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });
      // update logs with the new progress
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      // update progress with the new progress
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Indexing of properties in collection
      const collection = await connection.getCollection(options.collectionName);
      await collection.createIndex({ 'data.comment': 1 });
      await collection.createIndex({ 'data.description': 1 });
      await collection.createIndex({ 'data.name': 1 });
      await collection.createIndex({ 'data.results': 1 });
      await collection.createIndex({ 'data.sids': 1 });
      await collection.createIndex({ 'data.associatedCIDs': 1 });
    } else {
      debug.info(`collection already updated`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.stack, {
        collection: options.collectionName,
        connection,
        stack: e.stack,
      });
    }
  }
}
