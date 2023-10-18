import { searchHandler } from './searchHandlers/searchHandler.js';

// export the handler
const fromMasses = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve mass spectra from range of masses, from EM or from MF',
    description:
      'Allows to search for mass spectra based on a range of m/z values. Also allows to search for exact mass or molecular formula.',
    querystring: {
      masses: {
        type: 'string',
        description: 'List experimental mass',
        example: '125.02,185.09',
        default: '',
      },
      precision: {
        type: 'number',
        description: 'Precision (in ppm) of the monoisotopic mass',
        default: 10,
      },
      mode: {
        type: 'string',
        description: 'Mode of the mass spectra: positive or negative',
        default: 'positive',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 10,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data.masses.positive,data.ocl',
      },
    },
  },
  handler: searchHandler,
};
export default fromMasses;
