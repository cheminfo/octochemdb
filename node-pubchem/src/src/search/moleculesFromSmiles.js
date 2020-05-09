'use strict';

// query for molecules from monoisotopic mass
const pubChemConnection = new (require('../util/PubChemConnection'))();
const { Molecule } = require('openchemlib');
const debug = require('debug')('moleculesFromSmiles');

/**
 * Find molecules from a monoisotopic mass
 * @param {number} smiles
 * @param {object} [options={}]
 * @param {object} [options.noStereo=true]
 * @return {Array}
 */
module.exports = async function moleculesFromSmiles(smiles, options = {}) {
  let { limit = 1e3, noStereo = true } = options;

  if (!smiles) {
    throw new Error('smiles parameter must be specified');
  }
  const molecule = Molecule.fromSmiles(smiles);
  let mongoQuery = {};
  if (noStereo) {
    molecule.stripStereoInformation();
    mongoQuery = {
      noStereoID: molecule.getIDCode(),
    };
  } else {
    mongoQuery = {
      ocl: { id: molecule.getIDCode() },
    };
  }
  debug(JSON.stringify({ mongoQuery }));
  const collection = await pubChemConnection.getMoleculesCollection();

  return collection
    .aggregate([
      { $match: mongoQuery },
      { $limit: Number(limit) },
      {
        $project: {
          id: '$_id',
          iupac: 1,
          ocl: 1,
          mf: 1,
          em: 1,
          nbFragments: 1,
          charge: 1,
        },
      },
    ])
    .toArray();
};
