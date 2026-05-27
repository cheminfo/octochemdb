import { idHandler } from './searchHandlers/idHandler.js';

/**
 * Fastify route definition: retrieve a single PubMed article by its PMID.
 * @type {import('fastify').RouteOptions}
 */
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
  handler: idHandler,
};

export default fromPMID;
