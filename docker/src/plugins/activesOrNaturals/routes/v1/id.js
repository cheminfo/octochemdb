import { idHandler } from './searchHandlers/idHandler.js';

const entriesFromID = {
  method: 'GET',
  handler: idHandler,
  schema: {
    summary: 'Retrieve the entry for a given noStereoTautomerID',
    description:
      'This route retrieves the entry for a given noStereoTautomerID, which is a ocl idCode of the molecule without stereochemistry and tautomerism. \n This is could be useful to retrieve the information about the molecule, such as the molecular formula, the bioassays, the publications, etc.',
    querystring: {
      id: {
        type: 'string',
        description: 'noStereoTautomerID',
        example:
          'fhiAP@@Xe[vRJJFYIJJDYxMUUUUUP@ZzQcFBXiafNXecVCXm`NOtQfJvOacxZuSGpq|L',
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
    },
  },
};
export default entriesFromID;
