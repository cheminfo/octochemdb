'use strict';

const debug = require('debug')('moleculesFromMf');
const getFields = require('./getFields');
// query for molecules from molecular formula
const pubChemConnection = new (require('../util/PubChemConnection'))();

/**
 * Find molecules from a monoisotopic mass
 * @param {string} mf
 * @param {object} [options={}]
 * @param {object} [options.limit=1000]
 * @return {Array}
 */
module.exports = async function moleculesFromMf(mf, options = {}) {
  let { limit = 1e3, fields = 'iupac,ocl,mf,em,nbFragments,charge' } = options;

  if (!mf) {
    throw new Error('mf parameter must be specified');
  }

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;

  const collection = await pubChemConnection.getMoleculesCollection();

  const mongoQuery = { mf };
  debug(JSON.stringify({ mongoQuery }));
  return collection
    .aggregate([
      { $match: mongoQuery },
      { $limit: Number(limit) },
      {
        $project: getFields(fields),
      },
    ])
    .toArray();
};
