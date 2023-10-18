import { fromEMHandler } from './searchHandlers/fromEMHandler.js';

const fromEMs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Find molecular formula from a monoisotopic mass',
    description:
      'Useful to retrieve all the molecular formula that have a given monoisotopic mass',
    querystring: {
      em: {
        type: 'string',
        description: 'Monoisotopic mass',
        example: '300.123, 259.0237',
        default: '',
      },
      minCount: {
        type: 'number',
        description: 'Minimum number of mfs in PubChem',
        default: 5,
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
        default: 'data',
      },
    },
  },
  handler: fromEMHandler,
};

export default fromEMs;
