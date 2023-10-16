import { fromEMHandler } from './searchHandlers/fromEMHandler';

const fromEM = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compounds from a monoisotopic mass',
    description:
      'Allows to search for compounds based on a monoisotopic mass, precision (accuracy) of the measurement.',
    querystring: {
      em: {
        type: 'number',
        description: 'Monoisotopic mass',
        example: 300.123,
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
          'data.em,data.mf,data.unsaturation,data.charge,data.ocl.idCode',
      },
    },
  },
  handler: fromEMHandler,
};

export default fromEM;
