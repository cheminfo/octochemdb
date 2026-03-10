import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import debugLibrary from '../../../../utils/Debug.js';

import { parseHtmlEntities } from './parseHtmlEntities.js';

const debug = debugLibrary('insertTitle');

/**
 * Parses a gzipped patent-title TTL file and upserts each patent's title into
 * the `patents_tmp` collection.
 *
 * Each line of the file is a three-tab-separated triple:
 * `<patent URI> <predicate> "<title>"`. The function extracts the patent ID
 * and title, then bulk-upserts them in batches of 10 000.
 *
 * `data.nbCompounds` is intentionally **not** set here. It is populated in a
 * dedicated post-processing step (`addNbCompoundsToPatents`) that runs after
 * the `compoundPatents` collection has been fully synced.
 *
 * @async
 * @param {string} filneName - Path to the gzipped TTL input file.
 * @param {OctoChemConnection} connection
 *   An active OctoChemConnection instance.
 * @returns {Promise<void>}
 */
export default async function insertTitle(filneName, connection) {
  try {
    const temporaryCollection = await connection.getCollection('patents_tmp');
    const readStream = createReadStream(filneName);
    const stream = readStream.pipe(createGunzip());
    const lines = createInterface({ input: stream });
    let start = Date.now();
    let count = 0;
    let promise = [];
    for await (const line of lines) {
      /** @type {PatentEntry} */
      let entry = {};
      let fields = line.split('\t');
      if (fields.length !== 3) continue;
      // Extract the patent ID from the subject URI, e.g. "patent:US12345" → "US12345".
      let regex = /patent:(?<temp1>.*)/;
      let patentID = fields[0].match(regex)?.groups?.temp1;

      // Extract the quoted title string from the object literal.
      regex = /"(?<temp1>.*)"/;
      let title = fields[2].match(regex)?.groups?.temp1;
      if (title) {
        title = parseHtmlEntities(title);
      }
      if (patentID && title) {
        entry._id = patentID;
        entry.data = {};
        entry.data.title = title;
      }
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
        debug.trace(`Tiles parsed ${count}`);
        start = Date.now();
      }
      count++;
      if (!entry._id) continue;
      // Patent _id values are strings (e.g. "US12345"), not ObjectIds.
      /** @type {any} */
      const filter = { _id: entry._id };
      promise.push(
        temporaryCollection.updateOne(
          filter,
          { $set: entry },
          { upsert: true },
        ),
      );
      if (promise.length > 10000) {
        await Promise.all(promise);
        promise = [];
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
