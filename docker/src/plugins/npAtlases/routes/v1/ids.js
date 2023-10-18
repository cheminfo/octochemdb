import { idsHandler } from './searchHandlers/idsHandler.js';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve npAtlases entries for given npAtlases IDs',
    description: 'Allows to search for compounds data',
    querystring: {
      ids: {
        type: 'string',
        description: 'npAtlases IDs ',
        example: 'NPA000001, NPA000003',
        default: '',
      },

      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
    },
  },
  handler: idsHandler,
};

export default searchIDs;
