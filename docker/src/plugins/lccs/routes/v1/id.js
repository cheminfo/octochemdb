import { idHandler } from './searchHandlers/idHandler.js';

const searchIDs = {
  method: 'GET',
  schema: {
    summary: 'Retrieve LCCS information for given compound ID',
    description: 'Allows to search for compound data',
    querystring: {
      id: {
        type: 'string',
        description: 'compound ID ',
        example: '2',
        default: '',
      },

      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
    },
  },
  handler: idHandler,
};

export default searchIDs;
