import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('fromID');

export async function idHandler(request) {
  let { id = '', fields = 'data.ocl.noStereoTautomerID' } = request.query;

  let connection;
  try {
    connection = new OctoChemConnection();
    // get the collection
    const collection = await connection.getCollection('gnps');

    const results = await collection
      .aggregate([
        { $match: { _id: id } },
        { $limit: 1 },
        {
          $project: getFields(fields),
        },
      ])
      .next();
    return { data: results };
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'gnps',
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
