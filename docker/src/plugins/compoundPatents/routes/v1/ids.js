import { idsHandler } from './searchHandlers/idsHandler.js';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve compoundPatents entries for given compound IDs',
    description: 'Allows to search for compounds data',
    querystring: {
      ids: {
        type: 'string',
        description: 'compound IDs ',
        example: '31401, 31405',
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
