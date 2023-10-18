import { idsHandler } from './searchHandlers/idsHandler.js';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve compounds for given compounds IDs',
    description: 'Allows to search for compounds data',
    querystring: {
      ids: {
        type: 'string',
        description: 'compounds IDs ',
        example: '102126174,102126173',
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
