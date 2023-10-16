import { fromSmilesHandler } from './searchHandlers/fromSmilesHandler';

const fromSmiles = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compounds from a SMILES',
    description:
      'Retrieve entry in compounds collection from a SMILES. This route can take into account the stereochemistry.',
    querystring: {
      smiles: {
        type: 'string',
        description: 'SMILES',
        example: 'c1ccccc1',
        default: 'c1ccccc1',
      },
      stereo: {
        type: 'boolean',
        description: 'Take into account the stereochemistry',
        default: true,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 1000,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data.em,data.mf,data.total,data.atom,data.unsaturation',
      },
    },
  },
  handler: fromSmilesHandler,
};

export default fromSmiles;
