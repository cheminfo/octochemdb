import { join } from 'path';

import { fileCollectionFromPath } from 'filelist-utils';
import FSExtra from 'fs-extra';

import getFileIfNew from '../../../../../sync/http/utils/getFileIfNew.js';
import debugLibrary from '../../../../../utils/Debug.js';

import getFileListPatents from './getFileListPatents.js';

const { mkdirpSync, existsSync } = FSExtra;
const debug = debugLibrary('getTitlesAndAbstracts');

/**
 * Downloads (or collects already-downloaded) patent title and abstract TTL.GZ
 * files from the PubChem FTP server into `destinationFolder`.
 *
 * Workflow:
 * 1. Ensures the destination directory tree exists (`abstracts/` and
 *    `titles/` subdirectories).
 * 2. Fetches the list of available files via `getFileListPatents`.
 * 3. For each file not yet present locally, downloads it with `getFileIfNew`.
 * 4. If no new files were downloaded, falls back to the files already on disk
 *    by scanning the destination subdirectories with `fileCollectionFromPath`.
 *
 * @param {string} source - Base URL of the PubChem patent RDF directory.
 * @param {string} destinationFolder - Local directory that receives the files.
 * @returns {Promise<TitlesAndAbstracts | undefined>}
 *   Resolves with the paths of all available files, or `undefined` if an error
 *   occurs or no files are ready.
 */
async function getTitlesAndAbstracts(source, destinationFolder) {
  try {
    // Ensure the top-level destination folder and both sub-folders exist.
    if (!existsSync(destinationFolder)) {
      mkdirpSync(destinationFolder);
    }
    if (!existsSync(join(destinationFolder, 'abstracts'))) {
      mkdirpSync(join(destinationFolder, 'abstracts'));
    }
    if (!existsSync(join(destinationFolder, 'titles'))) {
      mkdirpSync(join(destinationFolder, 'titles'));
    }

    // Retrieve the remote file listing, keeping only `.ttl.gz` entries.
    let list = await getFileListPatents(source, {
      fileFilter: (file) => !!(file && file.name.endsWith('ttl.gz')),
    });
    let abstracts2Download = list?.abstracts2Download ?? [];
    let titles2Download = list?.titles2Download ?? [];
    let abstractsDownloaded = [];

    if (process.env.NODE_ENV !== 'test') {
      // Download abstract files that are new or have changed.
      for (let file of abstracts2Download) {
        let options = {
          filename: file.name.replace('.gz', ''),
          extension: 'gz',
        };
        let target = join(destinationFolder, 'abstracts');
        let fileDownloaded = await getFileIfNew(file, target, options);
        if (fileDownloaded) {
          abstractsDownloaded.push(fileDownloaded);
        }
      }

      let titlesDownloaded = [];
      // Download title files that are new or have changed.
      for (let file of titles2Download) {
        let options = {
          filename: file.name.replace('.gz', ''),
          extension: 'gz',
        };
        let target = join(destinationFolder, 'titles');
        let fileDownloaded = await getFileIfNew(file, target, options);
        if (fileDownloaded) {
          titlesDownloaded.push(fileDownloaded);
        }
      }

      if (abstractsDownloaded.length > 0 && titlesDownloaded.length > 0) {
        // At least one file was freshly downloaded — return the new paths.
        return { abstractsDownloaded, titlesDownloaded };
      } else {
        // No new downloads; fall back to whatever is already on disk.
        let abstractsDownloadedCollection = await fileCollectionFromPath(
          join(destinationFolder, 'abstracts'),
          { ungzip: { gzipExtensions: [] } },
        );
        let titlesDownloadedCollection = await fileCollectionFromPath(
          join(destinationFolder, 'titles'),
          { ungzip: { gzipExtensions: [] } },
        );
        for (let file of abstractsDownloadedCollection) {
          abstractsDownloaded.push(file.relativePath);
        }
        for (let file of titlesDownloadedCollection) {
          titlesDownloaded.push(file.relativePath);
        }
        return { abstractsDownloaded, titlesDownloaded };
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    debug.fatal(err.message, { stack: err.stack });
  }
}

export default getTitlesAndAbstracts;
