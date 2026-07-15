import { idsHandler } from './searchHandlers/idsHandler.js';

/**
 * Fastify route definition for retrieving titleCompounds entries by
 * compound IDs. Accepts GET and POST requests with `ids` and `fields`
 * query parameters and delegates handling to `idsHandler`.
 */
const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve titleCompounds entries for given compound IDs',
    description: 'Allows to search for titleCompounds data',
    querystring: {
      type: 'object',
      properties: {
        ids: {
          type: 'string',
          description: 'compound IDs ',
          example: '4702, 4714',
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
