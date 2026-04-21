/* eslint-disable camelcase */

import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';

import { getCidFromPmid } from './utils/getCidFromPmid.js';
import { getFilesToImport } from './utils/getFilesToImport.js';
import { importPubmedFiles } from './utils/importPubmedFiles.js';
import { syncPubmedFolder } from './utils/syncPubmedFolder.js';

/**
 * Performs the initial bulk import of PubMed baseline dump files.
 *
 * Workflow:
 * 1. Check the progress document — if state is already `'updated'`,
 *    the baseline has been fully imported and the function exits early.
 * 2. In test mode, use a local fixture file; otherwise synchronise
 *    the remote PubMed baseline folder to local storage.
 * 3. Determine which files still need importing (resume support).
 * 4. Download the CID→PMID mapping from PubChem so that each PubMed
 *    article can be linked to its associated compound CIDs.
 * 5. Import every remaining baseline XML file into the `pubmeds`
 *    collection, upserting one document per article.
 * 6. Mark progress as `'updated'`, persist the end timestamp, and
 *    rebuild the collection indexes (including a weighted text index
 *    on title, MeSH headings, and abstract).
 *
 * @param {OctoChemConnection} connection - Active database connection.
 * @returns {Promise<void>}
 */
async function firstPubmedImport(connection) {
  const debug = debugLibrary('firstPubmedImport');
  try {
    const progress = await connection.getProgress('pubmeds');

    // Skip entirely when the baseline import has already completed
    if (progress.state === 'updated') {
      debug.info('First importation has been completed. Should only update.');
      return;
    } else {
      debug.info(`Continuing first importation from ${progress.seq}.`);
    }

    // In test mode use a local fixture; in production sync the remote folder
    /** @type {{ name: string; path: string }[]} */
    let allFiles;
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: 'firstImportTest.xml.gz',
          path: `../docker/src/plugins/pubmeds/sync/utils/__tests__/data/firstImportTest.xml.gz`,
        },
      ];
    } else {
      allFiles = await syncPubmedFolder(connection, 'first');
    }

    // Determine the subset of files still pending import
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'first',
    );

    // Mark progress as "updating" so partial runs can be detected
    progress.state = 'updating';
    await connection.setProgress(progress);

    // Download the CID→PMID mapping so articles can reference compounds
    /** @type {SyncOptions} */
    const options = {
      collectionSource:
        'https://ftp.ncbi.nlm.nih.gov/pubchem/Compound/Extras/CID-PMID.gz',
      destinationLocal: `../originalData//pubmeds/cidToPmid`,
      collectionName: 'pubmeds',
      filenameNew: 'cidToPmid',
      extensionNew: 'gz',
    };

    let cidToPmidPath;
    if (process.env.NODE_ENV === 'test') {
      cidToPmidPath = `../docker/src/plugins/pubmeds/sync/utils/__tests__/data/cidToPmidTest.gz`;
    } else {
      cidToPmidPath = await getLastFileSync(options);
    }

    const pmidToCid = await getCidFromPmid(cidToPmidPath, connection);

    // Process every pending baseline file sequentially
    await importPubmedFiles(
      connection,
      progress,
      files,
      { lastDocument },
      pmidToCid,
      'first',
    );

    // Finalise progress: record end timestamp and mark as done
    progress.state = 'updated';
    progress.dateEnd = Date.now();
    await connection.setProgress(progress);

    // Rebuild indexes on the freshly-populated collection
    const collection = await connection.getCollection('pubmeds');
    await createIndexes(collection, [
      { 'data.meshHeadings': 1 },
      { 'data.compounds': 1 },
      { _seq: 1 },
    ]);

    // Weighted text index: title and MeSH headings score higher than abstract
    await collection.createIndex(
      {
        'data.article.title': 'text',
        'data.meshHeadings': 'text',
        'data.article.abstract': 'text',
      },
      { language_override: 'languageTextSearch' },
      {
        weights: {
          'data.article.title': 10,
          'data.meshHeadings': 10,
          'data.article.abstract': 1,
        },
      },
    );
  } catch (e) {
    if (connection) {
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'pubmeds',
        connection,
        stack: err.stack,
      });
    }
  }
}

export default firstPubmedImport;
