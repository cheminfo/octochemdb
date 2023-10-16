// query for molecules from monoisotopic mass
import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('fromMF');

export async function fromMFHandler(request) {
  let {
    mf = '',
    limit = 1e3,
    fields = 'data.em,data.mf,data.unsaturation,data.charge,data.ocl.idCode',
  } = request.query;

  if (limit > 5e4) limit = 5e4;
  if (limit < 1) limit = 1;

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('compounds');

    const results = await collection
      .aggregate([
        { $match: { 'data.mf': mf } },
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
