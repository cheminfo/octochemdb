import { idHandler } from './searchHandlers/idHandler';

const searchIDs = {
  method: 'GET',
  schema: {
    summary: 'Retrieve a patent abstract and title from a patent ID',
    description: 'Allows to search for articles Title and Abstract.',
    querystring: {
      id: {
        type: 'string',
        description: 'patents ID',
        example: 'CN101597246A',
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
