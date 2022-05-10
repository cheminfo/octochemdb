// query for molecules from monoisotopic mass
import { getFields, PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('entries bestOfCompounds');

const entriesAdmin = {
  method: 'GET',
  schema: {
    querystring: {
      noStereoID: {
        type: 'string',
        description: 'noStereoID',
        example: 'fmoAr@NVrUoU`bLbbdTTTJbTQbUaEhs`ecfjjijZjiZjh@@',
        default:
          'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
      },
      limit: {
        type: 'number',
        description:
          'limit of records for noStereoID, activities and taxonomies',
        example: 10,
        default: 50,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default:
          'data.em,data.charge,data.unsaturation,data.active,data.ocls,data.names,data.keywords,data.activities,data.taxonomies',
      },
    },
  },
  handler: searchHandler,
};

export default entriesAdmin;

async function searchHandler(request) {
  let {
    noStereoID = '',
    limit = 0,
    fields = 'data.em,data.charge,data.unsaturation,data.active,data.ocls,data.names,data.keywords,data.activities,data.taxonomies',
  } = request.query;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('bestOfCompounds');
    debug(JSON.stringify({ noStereoID }));
    let formatedFields = getFields(fields);
    formatedFields._id = 0;
    formatedFields['data.activities'] = {
      $slice: ['$data.activities', Number(limit)],
    };
    formatedFields['data.ocls'] = { $slice: ['$data.ocls', Number(limit)] };
    formatedFields['data.taxonomies'] = {
      $slice: ['$data.taxonomies', Number(limit)],
    };
    const results = await collection
      .aggregate([
        {
          $match: {
            _id: `${noStereoID}`,
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
