import { infoHandler } from './searchHandlers.js/infoHandler.js';

// export default searchHandler;
const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve an overview about all the collections',
    description:
      'Retrieve an overview (stored in admin) and statistics about all the collections',
  },
  handler: infoHandler,
};

export default stats;
