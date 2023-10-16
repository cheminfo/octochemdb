import { idsHandler } from './searchHandlers/idsHandler';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve lotuses entries for given lotuses IDs',
    description: 'Allows to search for compounds data',
    querystring: {
      ids: {
        type: 'string',
        description: 'lotuses IDs ',
        example: 'LTS0043466, LTS0256604',
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
