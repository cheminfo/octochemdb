import { searchHandler } from './searchHandlers/searchHandler.js';

const search = {
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
      keywords: {
        type: 'string',
        description:
          'Text to be searched in articles Title, Abstract or MeSH terms',
        example: 'antibiotic',
        default: '',
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
      minScore: {
        type: 'number',
        description: 'Text search score minimum',
        example: 2,
        default: 1,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        example: 200,
        default: 100,
      },
    },
  },
  handler: searchHandler,
};

export default search;
