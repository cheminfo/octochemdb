import { idsHandler } from './searchHandler/idsHandler.js';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve coconuts entries for given coconuts IDs',
    description: 'Allows to search for compounds data',
    querystring: {
      ids: {
        type: 'string',
        description: 'coconuts IDs ',
        example: 'CNP0220816, CNP0293916',
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
