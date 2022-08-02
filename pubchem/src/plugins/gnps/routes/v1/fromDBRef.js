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
    const collection = await connection.getCollection('compounds');

    debug(id);
    const results = await collection.findOne(
      { _id: id },
      { fields: getFields(fields) },
    );
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
