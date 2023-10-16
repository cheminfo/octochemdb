import { idsHandler } from './searchHandler/idsHandler';

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve massBank entries for given massBank IDs',
    description: 'Allows to search for compounds data',
    querystring: {
      ids: {
        type: 'string',
        description: 'massBank IDs ',
        example: 'MSBNK-AAFC-AC000292,MSBNK-AAFC-AC000854',
        default: '',
      },

      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
    },
  },
  handler: idsHandler,
};

export default searchIDs;
