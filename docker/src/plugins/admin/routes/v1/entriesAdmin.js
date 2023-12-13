import { entriesAdminHandler } from './searchHandlers/entriesAdminHandler.js';

const entriesAdmin = {
  method: 'GET',
  handler: entriesAdminHandler,
  schema: {
    summary: 'Retrieve entries from the admin collection for monitoring',
    description:
      'This route retrieves the entries from the admin collection. This can be integrated in a monitoring system to keep under control the collection state and the last 50 logs.',
    querystring: {
      collectionToSearch: {
        type: 'string',
        description: 'Collection progress',
        example: 'bioassays',
        default: 'bioassays',
      },
      limit: {
        type: 'number',
        description: 'limit logs message',
        example: 10,
        default: 50,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: '_id,state,seq,dateStart,dateEnd,logs,sources',
      },
    },
  },
};

export default entriesAdmin;
