import { statsHandler } from './searchHandlers/statsHandler.js';

const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the importationLogs collection',
    description:
      'This route retrieves the global statics for the collection importationLogs. This can be integrated in a monitoring system to keep under control the number of entries in the collection.',
  },
  handler: statsHandler,
};

export default stats;
