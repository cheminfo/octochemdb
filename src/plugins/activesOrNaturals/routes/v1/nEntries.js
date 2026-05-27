import { nEntriesHandler } from './searchHandlers/nEntriesHandler.js';

const nEntries = {
  method: 'GET',
  handler: nEntriesHandler,
  schema: {
    summary: 'Search for n entries while skipping the first k entries',
    description:
      'This function search for n entries while skipping the first k entries',
    querystring: {
      n: {
        type: 'number',
        description: 'Number of entries to retrieve',
        example: 1000,
      },
      k: {
        type: 'number',
        description: 'Number of entries to skip',
        default: 2000,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
    },
  },
};
export default nEntries;
