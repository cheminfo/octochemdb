import { statsHandler } from './searchHandlers/statsHandler.js';

const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the lotusesV2 collection',
    description:
      'This route retrieves the global statistics for the collection lotusesV2. This can be integrated in a monitoring system to keep under control the number of entries in the collection.',
  },
  handler: statsHandler,
};

export default stats;
