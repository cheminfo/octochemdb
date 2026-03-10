import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import debugLibrary from '../../../../utils/Debug.js';

import { parseHtmlEntities } from './parseHtmlEntities.js';

const debug = debugLibrary('insertAbstract');

/**
 * Parses a gzipped patent-abstract TTL file and upserts each patent's abstract
 * into the `patents_tmp` collection.
 *
 * Each line is a three-tab-separated triple:
 * `<patent URI> <predicate> "<abstract>"`. Only the abstract text is updated;
 * any previously inserted fields (e.g. `data.title`) are preserved.
 *
 * Lines where either the patent ID or abstract cannot be extracted are skipped
 * silently. Updates are batched in groups of 10 000 before being awaited to
 * avoid opening too many concurrent connections.
 *
 * @async
 * @param {string} filneName - Path to the gzipped TTL input file.
 * @param {OctoChemConnection} connection - An active OctoChemConnection instance.
 * @returns {Promise<void>}
 */
export default async function insertAbstract(filneName, connection) {
  try {
    const temporaryCollection = await connection.getCollection('patents_tmp');
    const readStream = createReadStream(filneName);
    const stream = readStream.pipe(createGunzip());
    let start = Date.now();
    let count = 0;
    let promise = [];
    const lines = createInterface({ input: stream });
    for await (const line of lines) {
      let fields = line.split('\t');
      if (fields.length !== 3) continue;
      // Extract the patent ID from the subject URI, e.g. "patent:US12345" → "US12345".
      let regex = /patent:(?<temp1>.*)/;
      let patentID = fields[0].match(regex)?.groups?.temp1;
      // Extract the quoted abstract string from the object literal.
      regex = /"(?<temp1>.*)"/;
      let abstract = fields[2].match(regex)?.groups?.temp1;
      // parseHtmlEntities expects a string; skip the line if extraction failed.
      if (!abstract) continue;
      abstract = parseHtmlEntities(abstract);
      if (patentID && abstract) {
        /** @type {PatentEntry} */
        let entry = { _id: patentID, data: { abstract } };
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(`Abstracts parsed ${count}`);
          start = Date.now();
          count = 0;
        }
        count++;
        // Update only data.abstract so previously inserted fields
        // (e.g. data.title from insertTitle) are not overwritten.
        // Patent _id values are strings (e.g. "US12345"), not ObjectIds.
        /** @type {any} */
        const filter = { _id: entry._id };
        promise.push(
          temporaryCollection.updateOne(
            filter,
            { $set: { 'data.abstract': entry.data?.abstract } },
            { upsert: true },
          ),
        );
        if (promise.length > 10000) {
          await Promise.all(promise);
          promise = [];
        }
      } else {
        continue;
      }
    }
    await Promise.all(promise);
  } catch (e) {
    if (connection) {
      const error = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(error.message, {
        collection: 'patents',
        connection,
        stack: error.stack,
      });
    }
  }
}
