import { idHandler } from './searchHandler/idHandler';

const taxonomyFromID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve taxonomy from ncbi taxonomy ID',
    description: 'Allows to search for the taxonomy from ncbi taxonomy ID.',
    querystring: {
      id: {
        type: 'number',
        description: 'ncbi taxonomy ID',
        example: 662756,
        default: 562,
      },
    },
  },
  handler: idHandler,
};

export default taxonomyFromID;
