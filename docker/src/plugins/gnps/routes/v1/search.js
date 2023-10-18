import { searchHandler } from './searchHandler/searchHanlder.js';

// export the handler
const searchGNPS = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve mass spectra from range of masses, from EM or from MF',
    description:
      'Allows to search for mass spectra based on a range of m/z values. Also allows to search for exact mass or molecular formula.',
    querystring: {
      em: {
        type: 'string',
        description: 'Monoisotopic mass (in Da)',
        example: '980.533, 939.451',
        default: '',
      },
      masses: {
        type: 'string',
        description: 'List experimental mass',
        example: '289.2,295.5',
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
      mf: {
        type: 'string',
        description: 'MF of the compound',
        example: 'C48H72N10O12',
        default: '',
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
export default searchGNPS;
