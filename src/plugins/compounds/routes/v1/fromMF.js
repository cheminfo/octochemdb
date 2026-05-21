import { fromMFHandler } from './searchHandlers/fromMFHandler.js';

const fromMF = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compounds from a molecular formula',
    description:
      'Useful to retrieve all the compounds that have a given molecular formula',
    querystring: {
      mf: {
        type: 'string',
        description: 'Molecular formula',
        example: 'C37H60O8',
        default: '',
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
  handler: fromMFHandler,
};

export default fromMF;
