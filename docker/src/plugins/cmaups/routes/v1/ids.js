import { idsHandler } from './searchHandlers/idsHandler';

const searchIDs = {
  method: ['GET', 'POST'],
  handler: idsHandler,
  schema: {
    summary: 'Retrieve cmaups entries for given cmaups IDs',
    description: 'Allows to search for compounds data',
    querystring: {
      ids: {
        type: 'string',
        description: 'cmaups IDs ',
        example: 'NPC222524,NPC26601',
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
