import { PubChemConnection, getFields } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('fromDBRef');

const fromDBRef = {
  method: 'GET',
  schema: {
    summary: 'Retrieve massSpectrum from a DBRef',
    description: '',
    querystring: {
      id: {
        type: 'string',
        description: 'GNPS ID',
        example: 'CCMSLIB00000001547',
        default: null,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default:
          'data.ocl.noStereoID,data.ocl.idCode,data.spectrum.msLevel,data.spectrum.ionSource,data.spectrum.instrument,data.spectrum.precursorMz,data.spectrum.adduct,data.spectrum.ionMode,data.spectrum.data',
      },
    },
  },
  handler: searchHandler,
};

export default fromDBRef;

async function searchHandler(request) {
  let {
    id = '',
    fields = 'data.ocl.noStereoID,data.ocl.idCode,data.spectrum.msLevel,data.spectrum.ionSource,data.spectrum.instrument,data.spectrum.precursorMz,data.spectrum.adduct,data.spectrum.ionMode,data.spectrum.data',
  } = request.query;

  let connection;
  try {
    connection = new PubChemConnection();
    // get the collection
    const collection = await connection.getCollection('gnps');

    debug(id);
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
      debug(e.message, { collection: 'compounds', connection, stack: e.stack });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
