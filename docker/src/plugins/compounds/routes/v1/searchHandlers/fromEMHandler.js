// query for molecules from monoisotopic mass
import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('fromEM');

export async function fromEMHandler(request) {
  let {
    em = 0,
    limit = 1e3,
    precision = 100,
    fields = 'data.em,data.mf,data.unsaturation,data.charge,data.ocl.idCode',
  } = request.query;

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  let error = (em / 1e6) * precision;

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('compounds');

    const results = await collection
      .aggregate([
        { $match: { 'data.em': { $lt: em + error, $gt: em - error } } },
        { $limit: limit },
        {
          $project: getFields(fields),
        },
      ])
      .toArray();

    return { data: results };
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'compounds',
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
