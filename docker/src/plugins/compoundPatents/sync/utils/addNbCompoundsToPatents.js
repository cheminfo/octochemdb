import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('addNbCompoundsToPatents');

/**
 * Populates `data.nbCompounds` on every document in the `patents` collection
 * based on the freshly synced `compoundPatents` data.
 *
 * Strategy:
 *  1. Run an aggregation pipeline over `compoundPatents` that unwinds each
 *     patent ID from `data.patents` and groups by patent ID to produce a
 *     per-patent compound count.
 *  2. Stream the results and bulk-write `$set { 'data.nbCompounds': n }` into
 *     the `patents` collection in batches of 10 000.
 *  3. Set `data.nbCompounds` to 0 on any patent that had no matching compounds
 *     (i.e. documents that were not touched by step 2).
 *
 * This function must be called **after** both `syncPatents` and
 * `syncCompoundPatents` have completed so that both collections contain
 * up-to-date data.
 *
 * @async
 * @param {OctoChemConnection} connection
 *   An active OctoChemConnection instance.
 * @returns {Promise<void>}
 */
export default async function addNbCompoundsToPatents(connection) {
  try {
    const patentsCollection = await connection.getCollection('patents');
    const compoundPatentsCollection =
      await connection.getCollection('compoundPatents');

    // Aggregate: for each compound document unwind its patent array
    // and count how many compounds reference each patent ID.
    const cursor = compoundPatentsCollection.aggregate([
      { $unwind: '$data.patents' },
      { $group: { _id: '$data.patents', nbCompounds: { $sum: 1 } } },
    ]);

    // Stream aggregation results and bulk-write into patents in batches.
    let bulk = [];
    let total = 0;
    let start = Date.now();

    for await (const doc of cursor) {
      bulk.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { 'data.nbCompounds': doc.nbCompounds } },
        },
      });

      if (bulk.length >= 10_000) {
        await patentsCollection.bulkWrite(bulk, { ordered: false });
        total += bulk.length;
        bulk = [];

        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(`Updated nbCompounds on ${total} patents`);
          start = Date.now();
        }
      }
    }

    // Flush the last (partial) batch.
    if (bulk.length) {
      await patentsCollection.bulkWrite(bulk, { ordered: false });
      total += bulk.length;
    }

    // Step 3 — patents that were not touched by the bulk write have no
    // compound associations; explicitly set their count to 0 so every
    // document has a defined, queryable value.
    await patentsCollection.updateMany(
      { 'data.nbCompounds': { $exists: false } },
      { $set: { 'data.nbCompounds': 0 } },
    );

    debug.trace(`addNbCompoundsToPatents complete — ${total} patents updated`);
  } catch (e) {
    if (connection) {
      const error = e instanceof Error ? e : new Error(String(e));
      await debugLibrary('addNbCompoundsToPatents').fatal(error.message, {
        collection: 'patents',
        connection,
        stack: error.stack,
      });
    }
  }
}
