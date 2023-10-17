import { idsHandler } from './searchHandlers/idsHandler';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve LCCS informations for given compounds IDs',
    description: 'Allows to search for compounds data',
    querystring: {
      ids: {
        type: 'string',
        description: 'compounds IDs ',
        example: '2,8',
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
