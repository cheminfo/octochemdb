// query for molecules from monoisotopic mass
import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
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
  } catch (error_) {
    if (connection) {
      await debug.fatal(error_.message, {
        collection: 'compounds',
        connection,
        stack: error_.stack,
      });
    }
    return { errors: [{ title: error_.message, detail: error_.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}
