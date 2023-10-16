import { searchHandler } from './searchHandlers/searchHandler';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary:
      'Retrieve articles which title or abstract contains the given text',
    description: 'Allows to search for articles Title and Abstract.',
    querystring: {
      patentsIDs: {
        type: 'string',
        description: 'patents IDs',
        example: 'EP-2078065-A2, EP-1293521-A2',
        default: '',
      },
      keywords: {
        type: 'string',
        description: 'Text to be searched in articles Title and Abstract',
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

export default searchIDs;
