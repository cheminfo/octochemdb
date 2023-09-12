// query for molecules from monoisotopic mass
import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromPMID');

const fromPMID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve article from a PubMed ID',
    description: 'Allows to search for an article from PubMed using PMID',
    querystring: {
      id: {
        type: 'number',
        description: 'PubMed ID',
        example: 1,
        default: 1,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
    },
  },
  handler: searchHandler,
};

export default fromPMID;

async function searchHandler(request) {
  let { id = 1, fields = 'data' } = request.query;

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('pubmeds');

    const results = await collection
      .aggregate([
        { $match: { _id: id } },
        {
          $project: getFields(fields),
        },
      ])
      .toArray();
    return { data: results[0] };
  } catch (e) {
    if (connection) {
      await debug.error(e.message, {
        collection: 'pubmeds',
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
