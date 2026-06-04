import { idsHandler } from './searchHandlers/idsHandler.js';

const searchIDs = {
  method: ['GET', 'POST'],
  handler: idsHandler,
  schema: {
    summary: 'Retrieve PubChem bioassays for given AIDs',
    description:
      'Allows to search for PubChem bioassay descriptions by AID. Returns the full assay metadata stored in the bioassaysPubChem collection.',
    querystring: {
      ids: {
        type: 'string',
        description: 'PubChem AIDs (comma-separated)',
        example: '22001,22002',
        default: '',
      },

      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
    },
  },
};

export default searchIDs;
