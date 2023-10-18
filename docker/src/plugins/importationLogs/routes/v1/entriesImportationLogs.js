import { entriesImportationLogsHandler } from './searchHandlers/entriesImportationLogsHandler.js';

const entriesImportationLogs = {
  method: 'GET',
  schema: {
    summary: 'Retrieve importation logs from a collection',
    description:
      'This route retrieves the importation logs for a given collection. This can be integrated in a monitoring system to keep under control the importation/aggregation process.',
    querystring: {
      collectionName: {
        type: 'string',
        description: 'Collection Name',
        example: 'bioassays',
        default: '',
      },
      limit: {
        type: 'number',
        description: 'Max result output, descending order (date)',
        example: 10,
        default: 1000,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default:
          'collectionName,sources,dateStart,dateEnd,startSequenceID,endSequenceID,status',
      },
    },
  },
  handler: entriesImportationLogsHandler,
};

export default entriesImportationLogs;
