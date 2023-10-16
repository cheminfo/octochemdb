import { idsHandler } from './searchHandlers/idsHandler';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary:
      'Retrieve articles which title, MeSH terms or abstract contains the given text',
    description: 'Allows to search for articles Title and Abstract.',
    querystring: {
      ids: {
        type: 'string',
        description: 'PubMed IDs comma separated',
        example: '19342308,17200418',
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
