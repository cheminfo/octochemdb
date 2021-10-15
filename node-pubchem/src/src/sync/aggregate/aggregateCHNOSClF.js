'use strict';

const debug = require('debug')('aggregateCHNOSClF');

module.exports = async function aggregateCHNOSClF(connection) {
  const collection = await connection.getCollection('compounds');
  debug('Need to aggregate', await collection.countDocuments(), 'entries');
  let result = collection.aggregate(
    [
      { $limit: 1e10 },
      {
        $match: {
          nbFragments: 1,
          mf: {
            $regex: /^C[0-9]*H[0-9]*Cl?[0-9]*F?[0-9]*N?[0-9]*O?[0-9]*S?[0-9]*$/,
          },
          charge: { $lte: 1, $gte: -1 },
        },
      },
      {
        $project: {
          _id: 0,
          mf: 1,
          em: 1,
          unsat: 1,
        },
      },
      {
        $group: {
          _id: '$mf',
          count: { $sum: 1 },
          em: { $first: '$em' },
          unsaturation: { $first: '$unsat' },
        },
      },
      { $out: 'mfsCHNOSClF' },
    ],
    {
      allowDiskUse: true,
      maxTimeMS: 60 * 60 * 1000, // 1h
    },
  );
  await result.hasNext(); // trigger the creation of the output collection
  return result;
};
