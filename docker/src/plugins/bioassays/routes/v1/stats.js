import { statsHandler } from './searchHandlers/statsHandler';

const stats = {
  method: 'GET',
  handler: statsHandler,
  schema: {
    summary: 'Retrieve global statistics from the bioassays collection',
    description:
      'This route retrieves the global statics for the collection bioassays. This can be integrated in a monitoring system to keep under control the number of entries in the collection.',
  },
};

export default stats;
