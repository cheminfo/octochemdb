import { idHandler } from './searchHandler/idHandler.js';

const fromID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve mass spectrum from GNPS ID',
    description: '',
    querystring: {
      id: {
        type: 'string',
        description: 'GNPS ID',
        example: 'CCMSLIB00000001547',
        default: 'CCMSLIB00000001547',
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
