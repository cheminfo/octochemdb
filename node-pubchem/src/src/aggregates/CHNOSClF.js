'use strict';

const pubChemConnection = new (require('../util/PubChemConnection'))();

module.exports = async function () {
  CHNOSClF(pubChemConnection)
    .catch((e) => console.log(e))
    .then(() => {
      console.log('Done');
      pubChemConnection.close();
    });
};

async function CHNOSClF(pubChemConnection) {
  const collection = await pubChemConnection.getMoleculesCollection();
  console.log(
    'CHNOSClF: Need to aggregate',
    await collection.count(),
    'entries'
  );
  let result = collection.aggregate(
    [
      { $limit: 1e10 },
      {
        $match: {
          nbFragments: 1,
          mf: {
            $regex: /^C[0-9]*H[0-9]*Cl?[0-9]*F?[0-9]*N?[0-9]*O?[0-9]*S?[0-9]*$/
          },
          charge: { $lte: 1, $gte: -1 }
        }
      },
      {
        $project: {
          _id: 0,
          mf: 1,
          em: 1,
          unsat: 1
        }
      },
      {
        $group: {
          _id: '$mf',
          count: { $sum: 1 },
          em: { $first: '$em' },
          unsaturation: { $first: '$unsat' }
        }
      },
      { $out: 'mfsCHNOSClF' }
    ],
    {
      allowDiskUse: true,
      maxTimeMS: 60 * 60 * 1000 // 1h
    }
  );
  await result.hasNext(); // trigger the creation of the output collection
  return result;
}
