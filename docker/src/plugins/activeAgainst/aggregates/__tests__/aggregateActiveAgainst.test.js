import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import { aggregate } from '../aggregateActiveAgainst';

test(
  'Aggregation activeAgainst',
  async () => {
    const connection = new OctoChemConnection();

    while (true) {
      const activeOrNaturalsCollection = await connection.getCollection(
        'activesOrNaturals',
      );
      if ((await activeOrNaturalsCollection.countDocuments()) === 63) {
        break;
      }
    }
    await aggregate(connection);
    const collection = await connection.getCollection('activeAgainst');
    const collectionEntry = await collection
      .find({
        _id: 'ArchaeaCandidatusBorrarchaeotaCandidatusBorrarchaeiaCandidatusBorrarchaealesCandidatusBorrarchaeaceaeCandidatusBorrarchaeum',
      })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }

    expect(result).toMatchSnapshot();
    await connection.close();
  },
  { timeout: 50000 },
);
