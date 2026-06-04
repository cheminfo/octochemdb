import { statsHandler } from './searchHandlers/statsHandler.js';

const stats = {
  method: 'GET',
  handler: statsHandler,
  schema: {
    summary: 'Retrieve global statistics from the bioassaysPubChem collection',
    description:
      'This route retrieves the global statistics for the collection bioassaysPubChem. This can be integrated in a monitoring system to keep under control the number of entries in the collection.',
  },
};

export default stats;
