import { idsHandler } from './searchHandler/idsHandler.js';

/**
 * Fastify route definition that retrieves taxonomy entries for a list of NCBI
 * taxonomy IDs via the `idsHandler`.
 */
const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve taxonomies entries for given taxonomies IDs',
    description: 'Allows to search for compounds data',
    querystring: {
      type: 'object',
      properties: {
        ids: {
          type: 'string',
          description: 'taxonomies IDs ',
          example: '2798915, 2798916',
          default: '',
        },

        fields: {
          type: 'string',
          description: 'Fields to retrieve',
          default: 'data',
        },
      },
    },
  },
  handler: idsHandler,
};

export default searchIDs;
