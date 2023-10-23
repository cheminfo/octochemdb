import { fromIDCodeHandler } from './searchHandlers/fromIDCodeHandler.js';

const fromIDCode = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compounds from a idCode',
    description:
      'Retrieve entry in compounds collection from a idCodedb. This route can take into account the stereochemistry.',
    querystring: {
      idCode: {
        type: 'string',
        description: 'idCode',
        example: 'dgnBBAAJdYR[YVZZjij`@',
        default: '',
      },
      stereo: {
        type: 'boolean',
        description:
          'Take into account the stereochemistry (only when idCode is provided)',
        default: true,
      },
      noStereoTautomerID: {
        type: 'string',
        description: 'noStereoTautomerID',
        example: 'dgnBBNBcoirQQQHrJUUUUPAkQXkGXwAxQLjicxX~FNicxX~F@',
        default: '',
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
      lccsFields: {
        type: 'string',
        description: 'Fields to retrieve from lccs',
        default: 'data',
      },
    },
  },
  handler: fromIDCodeHandler,
};

export default fromIDCode;
