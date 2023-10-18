import { idsHandler } from './searchHandlers/idsHandler.js';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary:
      'Retrieve articles which title or abstract contains the given text',
    description: 'Allows to search for articles Title and Abstract.',
    querystring: {
      ids: {
        type: 'string',
        description: 'patents IDs',
        example: 'EP-2078065-A2, EP-1293521-A2',
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
