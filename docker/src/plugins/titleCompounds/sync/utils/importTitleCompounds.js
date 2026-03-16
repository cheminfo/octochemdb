import { createReadStream } from 'fs';
import { createInterface } from 'readline';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('importTitleCompounds');

/**
 * Reads a decompressed TSV file where each line maps a PubChem Compound
 * ID (CID) to its title, and upserts each mapping into a temporary
 * MongoDB collection (`titleCompounds_tmp`).  Once the entire file has
 * been processed the temporary collection is atomically renamed to
 * `titleCompounds`, replacing any previous version.
 *
 * Expected TSV format (two columns per line):
 * ```
 * <CID>\t<Title>
 * ```
 *
 * @param {string} filneName - Path to the decompressed TSV file.
 * @param {OctoChemConnection} connection - Active database connection.
 * @returns {Promise<void>}
 */
export default async function importTitleCompounds(filneName, connection) {
  try {
    const temporaryCollection =
      await connection.getCollection('titleCompounds_tmp');
    const readStream = createReadStream(filneName);

    const progress = await connection.getProgress('titleCompounds');
    let start = Date.now();
    let count = 0;
    const lines = createInterface({ input: readStream });

    // Stream-process each line of the TSV
    for await (const line of lines) {
      const fields = line.split('\t');
      if (fields.length !== 2) continue;
      const [productID, titleProduct] = fields;

      count++;
      // Periodically log progress for observability
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
        debug.trace(`Imported ${count} compounds title`);
        start = Date.now();
      }
      await temporaryCollection.updateOne(
        { _id: Number(productID) },
        {
          $set: {
            _id: Number(productID),
            data: { title: titleProduct },
          },
        },
        { upsert: true },
      );
    }

    // Atomically replace the live collection with the temporary one
    await temporaryCollection.rename('titleCompounds', {
      dropTarget: true,
    });
    await connection.setProgress(progress);
  } catch (e) {
    if (connection) {
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'titleCompounds',
        connection,
        stack: err.stack,
      });
    }
  }
}
