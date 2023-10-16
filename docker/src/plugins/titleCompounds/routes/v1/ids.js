import { idsHandler } from './searchHandlers/idsHandler';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve titleCompounds entries for given compound IDs',
    description: 'Allows to search for titleCompounds data',
    querystring: {
      ids: {
        type: 'string',
        description: 'compound IDs ',
        example: '4702, 4714',
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
