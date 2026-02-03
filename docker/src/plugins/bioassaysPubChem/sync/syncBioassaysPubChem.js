import { join } from 'path';

import { fileCollectionFromPath } from 'filelist-utils';
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import syncFolder from '../../../sync/http/utils/syncFolder.js';
import debugLibrary from '../../../utils/Debug.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import { decompressAll } from './utils/decompressAll.js';
import { main } from './utils/main.js';

//***************
// NOT FINISHED *
//***************

const debug = debugLibrary('syncBioassaysPubChem');
export async function sync(connection) {
  let options = {
    collectionSource: 'https://ftp.ncbi.nlm.nih.gov/pubchem/Bioassay/JSON/',
    destinationLocal: `../originalData/bioassaysPubChem/full`,
    collectionName: 'bioassaysPubChem',
  };
  try {
    const progress = await connection.getProgress(options.collectionName);
    let sources = [];
    if (process.env.NODE_ENV === 'test') {
      sources = [
        `../docker/src/plugins/bioassaysPubChem/sync/utils/__test__/data/syncData/`,
      ];
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

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    const isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.BIOASSAYPUBCHEM_UPDATE_INTERVAL,
      connection,
    );
    if (isTimeToUpdate) {
      let sourceFiles = options.destinationLocal;
      if (process.env.NODE_ENV === 'test') {
        sourceFiles =
          '../docker/src/plugins/bioassaysPubChem/sync/utils/__test__/data/syncData/';
      }
      let fileList = await fileCollectionFromPath(sourceFiles, {
        unzip: { zipExtensions: [] },
        ungzip: { gzipExtensions: [] },
      });
      let jsonFilesPaths = [];
      for (let file of fileList.files) {
        if (file.name.endsWith('.zip')) {
          const newJsonFilesPaths = await decompressAll(
            join(sourceFiles, file.name),
          );
          jsonFilesPaths = [...newJsonFilesPaths, ...jsonFilesPaths];
        }
      }

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
