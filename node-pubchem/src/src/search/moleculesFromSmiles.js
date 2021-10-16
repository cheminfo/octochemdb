// query for molecules from monoisotopic mass
import Debug from 'debug';

import getFields from './getFields.js';

const pubChemConnection = new (require('../util/PubChemConnection'))();

const debug = Debug('moleculesFromSmiles');
/**
 * Find molecules from a monoisotopic mass
 * @param {number} smiles
 * @param {object} [options={}]
 * @param {object} [options.stereo=false]
 * @return {Array}
 */
export default async function moleculesFromSmiles(smiles, options = {}) {
  let {
    limit = 1e3,
    stereo = false,
    fields = 'iupac,ocl,mf,em,nbFragments,charge',
  } = options;

  if (options.stereo === 'true') stereo = true;

  if (!smiles) {
    throw new Error('smiles parameter must be specified');
  }
  const molecule = Molecule.fromSmiles(smiles);
  let mongoQuery = {};
  if (stereo) {
    mongoQuery = {
      'ocl.id': molecule.getIDCode(),
    };
  } else {
    molecule.stripStereoInformation();
    mongoQuery = {
      noStereoID: molecule.getIDCode(),
    };
  }
  debug(JSON.stringify({ mongoQuery }));
  const collection = await pubChemConnection.getCollection('compounds');

  return collection
    .aggregate([
      { $match: mongoQuery },
      { $limit: Number(limit) },
      {
        $project: getFields(fields),
      },
    ])
    .toArray();
}
