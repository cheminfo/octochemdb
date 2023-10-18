import { idHandler } from './searchHandler/idHandler.js';

const fromID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve mass spectrum from MassBank ID',
    description: '',
    querystring: {
      id: {
        type: 'string',
        description: 'MassBank ID',
        example: 'MSBNK-AAFC-AC000854',
        default: 'MSBNK-AAFC-AC000854',
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data.ocl.noStereoTautomerID, data.spectrum',
      },
    },
  },
  handler: idHandler,
};

export default fromID;
