import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('stats');

/**
 * Get global statistics from the activesOrNaturals collection.
 * @returns {Promise<{data: unknown} | {errors: Array<{title: string, detail: string}>}>}
 */
export async function statsHandler() {
  /** @type {OctoChemConnection | undefined} */
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('activesOrNaturals');

    const results = await collection
      .aggregate([{ $collStats: { latencyStats: { histograms: true } } }])
      .toArray();

    return { data: results };
  } catch (/** @type {any} */ e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}
