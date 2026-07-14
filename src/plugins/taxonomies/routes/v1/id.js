import { idHandler } from './searchHandler/idHandler.js';

/**
 * Fastify route definition that retrieves a taxonomy by its NCBI taxonomy ID
 * via the `idHandler`.
 */
const taxonomyFromID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve taxonomy from ncbi taxonomy ID',
    description: 'Allows to search for the taxonomy from ncbi taxonomy ID.',
    querystring: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'ncbi taxonomy ID',
          example: 662756,
          default: 562,
        },
      },
    },
  },
  handler: idHandler,
};

export default taxonomyFromID;
