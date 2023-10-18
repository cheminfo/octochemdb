import { idsHandler } from './searchHandler/idsHandler.js';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve npasses for given npasses IDs',
    description: 'Allows to search for npasses data',
    querystring: {
      ids: {
        type: 'string',
        description: 'npasses IDs ',
        example: 'NPC100096,NPC100079',
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
