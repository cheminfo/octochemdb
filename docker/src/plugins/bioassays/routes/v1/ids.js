import { idsHandler } from './searchHandlers/idsHandler';

const searchIDs = {
  method: ['GET', 'POST'],
  handler: idsHandler,
  schema: {
    summary: 'Retrieve bioassays for given bioassay IDs',
    description: 'Allows to search for articles Title and Abstract.',
    querystring: {
      ids: {
        type: 'string',
        description: 'Bioassays IDs ',
        example: '59478_1,5351641_1',
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
