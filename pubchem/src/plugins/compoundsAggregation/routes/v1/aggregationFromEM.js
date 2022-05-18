// query for molecules from monoisotopic mass
import { getFields, PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('entriesFromEM');

const entriesFromEM = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compounds from a monoisotopic mass',
    description:
      'Allows to search for pubchem compounds based on a monoisotopic mass, precision (accuracy) of the measurement.',
    querystring: {
      em: {
        type: 'number',
        description: 'Monoisotopic mass',
        example: 300.123,
        default: null,
      },

      familyName: {
        type: 'string',
        description: 'genus',
        example: 'Podocarpus',
        default: 'Podocarpus',
      },
      genusName: {
        type: 'string',
        description: 'genus',
        example: 'Podocarpus',
        default: 'Podocarpus',
      },
      speciesName: {
        type: 'string',
        description: 'species',
        example: 'Podocarpus macrophyllus or macrophyllus',
        default: null,
      },

      precision: {
        type: 'number',
        description: 'Precision (in ppm) of the monoisotopic mass',
        default: 100,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 1000,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default:
          'data.em,data.mf,data.charge,data.unsaturation,data.active,data.naturalProduct,data.ocls,data.names,data.keywords,data.activities,data.taxonomies',
      },
    },
  },
  handler: searchHandler,
};

export default entriesFromEM;

async function searchHandler(request) {
  let {
    em = 0,
    familyName = '',
    genusName = '',
    speciesName = '',
    limit = 1e3,
    precision = 100,

    fields = 'data.em,data.mf,data.charge,data.unsaturation,data.active,data.naturalProduct,data.ocls,data.names,data.keywords,data.activities,data.taxonomies',
  } = request.query;

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  let error = (em / 1e6) * precision;

  let family = familyName.toLowerCase();
  let genus = genusName.toLowerCase();
  let species;
  if (speciesName.split(' ').length > 1) {
    species = speciesName.split(' ')[1].toLowerCase();
  } else {
    species = speciesName.toLowerCase();
  }
  let searchTaxonomyParameter;
  let alreadySelected = false;
  if (species !== '') {
    searchTaxonomyParameter = species;
    alreadySelected = true;
  }
  if (genus !== '' && !alreadySelected) {
    searchTaxonomyParameter = genus;
    alreadySelected = true;
  }
  if (family !== '' && !alreadySelected) {
    searchTaxonomyParameter = family;
    alreadySelected = true;
  }

  let connection;

  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('temporaryAgregation');
    let formatedFields = getFields(fields);
    formatedFields._id = 0;
    debug(em);
    let matchParameter;
    if (em !== 0 && searchTaxonomyParameter !== '') {
      matchParameter = {
        'data.em': { $lt: em + error, $gt: em - error },
        'data.keywords': { $in: [new RegExp(searchTaxonomyParameter, 'i')] },
      };
    }
    if (em === 0 && searchTaxonomyParameter !== '') {
      matchParameter = {
        'data.keywords': { $in: [new RegExp(searchTaxonomyParameter, 'i')] },
      };
    }
    if (em !== 0 && searchTaxonomyParameter === '') {
      matchParameter = {
        'data.em': { $lt: em + error, $gt: em - error },
      };
    }
    const results = await collection
      .aggregate([
        { $match: { 'data.em': { $lt: em + error, $gt: em - error } } },
        { $limit: limit },
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
