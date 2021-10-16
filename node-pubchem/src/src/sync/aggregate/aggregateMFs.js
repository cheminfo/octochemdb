import Debug from 'debug';

import {
  COMPOUNDS_COLLECTION,
  MFS_COLLECTION,
} from '../../util/PubChemConnection.js';

const debug = Debug('aggregateMFs');

export default async function aggregateMFs(connection) {
  const collection = await connection.getCollection(COMPOUNDS_COLLECTION);
  debug('Need to aggregate', await collection.countDocuments(), 'entries');
  let result = await collection.aggregate(
    [
      { $match: { nbFragments: 1, charge: 0, mf: /^[^\]]+$/ } }, // one fragment, no charge and no isotopes
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
      { $out: 'mfs' },
    ],
    {
      allowDiskUse: true,
      maxTimeMS: 60 * 60 * 1000, // 1h
    },
  );
  await result.hasNext();

  let mfsCollection = await connection.getCollection(MFS_COLLECTION);
  await mfsCollection.createIndex({ em: 1 });
  await mfsCollection.createIndex({ total: 1 });

  return result;
}
