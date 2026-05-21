import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('stats');

/**
 * Get global statistics from the activesOrNaturals collection.
 * @returns
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
  } catch (/** @type {any} */ error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: error.stack,
      });
    }
    return { errors: [{ title: error.message, detail: error.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}
