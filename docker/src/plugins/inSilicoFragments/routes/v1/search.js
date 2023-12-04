import { searchHandler } from './searchHandler/searchHandler.js';

// export the handler
const searchInSilicoFragments = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve mass spectra from range of m/z values',
    description:
      'Allows to search for mass spectra based on a range of m/z values.',
    querystring: {
      masses: {
        type: 'string',
        description: 'List experimental mass',
        example: '341.078,149.0363,305.0575',
        default: '',
      },
      precision: {
        type: 'number',
        description: 'Precision (in ppm) of the monoisotopic mass',
        default: 10,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 10,
      },

      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data.spectrum,data.ocl',
      },
    },
  },
  handler: searchHandler,
};
export default searchInSilicoFragments;
