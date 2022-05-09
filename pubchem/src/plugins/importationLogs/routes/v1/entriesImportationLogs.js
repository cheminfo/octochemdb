// query for molecules from monoisotopic mass
import { getFields, PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('entries importation Logs');

const entriesAdmin = {
  method: 'GET',
  schema: {
    querystring: {
      collectionToSearch: {
        type: 'string',
        description: 'Collection progress',
        example: 'bioassays',
        default: 'bioassays',
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'state,seq,date,sources,logs',
      },
    },
  },
  handler: searchHandler,
};

export default entriesAdmin;

async function searchHandler(request) {
  let { collectionToSearch = '', fields = 'state,seq,date,sources,logs' } =
    request.query;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('admin');

    debug(JSON.stringify({ collectionToSearch }));
    let formatedFields = getFields(fields);
    formatedFields._id = 0;
    const results = await collection
      .aggregate([
        {
          $match: {
            _id: `${collectionToSearch}_progress`,
          },
        },
        {
          $project: formatedFields,
        },
      ])
      .toArray();
    return results;
  } catch (e) {
    debug(e.stack);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
