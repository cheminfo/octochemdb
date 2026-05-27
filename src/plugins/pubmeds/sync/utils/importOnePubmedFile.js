import { rmSync } from 'node:fs';
import { open } from 'node:fs/promises';

import { parseStream } from 'arraybuffer-xml-parser';

import debugLibrary from '../../../../utils/Debug.js';

import { decompressGziped } from './decompressGziped.js';
import { improvePubmed } from './improvePubmed.js';

/**
 * Decompresses, parses, and imports a single PubMed XML file into MongoDB.
 *
 * The file is first gunzipped to a temporary path, then streamed through
 * `arraybuffer-xml-parser` which yields one `PubmedArticle` element at a
 * time.  Each article is normalised via {@link improvePubmed} and upserted
 * into the `pubmeds` collection.
 *
 * Resume support: when `options.shouldImport` is `false`, entries are
 * skipped until the article matching `options.lastDocument._id` is found.
 *
 * After processing, the decompressed file is deleted and the progress
 * document is updated with the relative path of the imported file.
 * @param connection - Active database connection.
 * @param progress - Mutable progress document; `seq` and
 *   `sources` are updated in place.
 * @param file - File descriptor to import.
 * @param options
 *   Resume context.
 * @param pmidToCid - PMID → CID[] lookup map.
 * @param langPubmeds - ISO-639 code → full name map.
 * @returns Number of articles imported, or
 *   `undefined` if a fatal error occurred.
 */
export default async function importOnePubmedFile(
  connection,
  progress,
  file,
  options,
  pmidToCid,
  langPubmeds,
) {
  const debug = debugLibrary('importOnePubmedFile');
  try {
    const collection = await connection.getCollection('pubmeds');
    debug.trace(`Importing: ${file.name}`);

    // Decompress the .gz file and open the resulting XML for streaming
    const filePath = await decompressGziped(file.path);
    const fileStream = await open(filePath, 'r');
    const readableStream = fileStream.readableWebStream();

    let { shouldImport, lastDocument } = options;
    let imported = 0;

    // Stream-parse one <PubmedArticle> at a time to keep memory bounded
    for await (const entry of parseStream(readableStream, 'PubmedArticle')) {
      // Resume logic: skip entries until we reach the last-imported PMID
      if (!shouldImport) {
        if (entry.MedlineCitation.PMID['#text'] !== lastDocument._id) {
          continue;
        }
        shouldImport = true;
        debug.trace(`Skipping pubmeds till: ${lastDocument._id}`);
        continue;
      }

      if (shouldImport) {
        const result = await improvePubmed(entry, pmidToCid, langPubmeds);
        imported++;
        result._seq = ++progress.seq;
        // Upsert so incremental updates overwrite existing articles
        await collection.updateOne(
          { _id: result._id },
          { $set: result },
          { upsert: true },
        );
      }
    }

    // Persist which file was just processed (relative path for portability)
    progress.sources = file.path.replace(process.env.ORIGINAL_DATA_PATH, '');
    await connection.setProgress(progress);
    debug.trace(`${imported} articles processed`);

    // Clean up the decompressed XML file to reclaim disk space
    await fileStream.close();
    rmSync(filePath, { recursive: true });
    return imported;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    await debug.fatal(err.message, {
      collection: 'pubmeds',
      connection,
      stack: err.stack,
    });
  }
}
