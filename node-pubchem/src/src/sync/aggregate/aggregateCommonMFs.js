'use strict';

const debug = require('debug')('aggregateCommonMFs');

module.exports = async function aggregateCommonMFs(connection) {
  const collection = await connection.getCollection('compounds');
  debug(
    'commonMFs: Need to aggregate',
    await collection.countDocuments(),
    'entries',
  );
  let result = await collection.aggregate(
    [
      //    { $limit: 1e4 },
      { $match: { nbFragments: 1, charge: 0 } }, // we don't want charges in MF
      { $project: { _id: 0, mf: 1, em: 1, unsaturation: 1, atom: 1 } },
      {
        $group: {
          _id: '$mf',
          em: { $first: '$em' },
          unsaturation: { $first: '$unsaturation' },
          atom: { $first: '$atom' },
          total: { $sum: 1 },
        },
      },
      { $match: { total: { $gte: 5 } } }, // only MFs with at least 5 products in pubchem
      { $out: 'commonMFs' },
    ],
    {
      allowDiskUse: true,
      maxTimeMS: 60 * 60 * 1000, // 1h
    },
  );
  await result.hasNext();

  const collectionCommonMFs = await connection.getCollection('commonMFs');

  await collectionCommonMFs.createIndex({ em: 1 });

  return result;
};
