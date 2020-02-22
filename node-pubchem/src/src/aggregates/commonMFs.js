'use strict';

const pubChemConnection = new (require('../util/PubChemConnection'))();

module.exports = async function() {
  return commonMFs(pubChemConnection)
    .catch((e) => console.log(e))
    .then((result) => {
      console.log('Done');
      pubChemConnection.close();
    });
};

async function commonMFs(pubChemConnection) {
  const collection = await pubChemConnection.getMoleculesCollection();
  console.log(
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
      { $match: { total: { $gte: 5 } } },
      { $out: 'commonMFs' },
    ],
    {
      allowDiskUse: true,
      maxTimeMS: 60 * 60 * 1000, // 1h
    },
  );
  await result.hasNext();

  const collectionCommonMFs = await pubChemConnection.getCollection(
    'commonMFs',
  );

  await collectionCommonMFs.createIndex({ em: 1 });

  return result;
}
