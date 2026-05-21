import { idsHandler } from './searchHandlers/idsHandler.js';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve lotusesV2 entries for given Wikidata compound IDs',
    description: 'Allows to search for compounds data from LOTUS Wikidata',
    querystring: {
      ids: {
        type: 'string',
        description: 'Wikidata compound IDs',
        example: 'Q27109816, Q312266',
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
