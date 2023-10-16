import { idHandler } from './searchHandlers/idHandler';

const searchIDs = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compound for given compound ID',
    description: 'Allows to search for compound data',
    querystring: {
      id: {
        type: 'string',
        description: 'compound ID ',
        example: '102126174',
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
