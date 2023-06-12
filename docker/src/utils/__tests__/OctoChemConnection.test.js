import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../OctoChemConnection';

dotenv.config();

test(
  'connection to DB',
  async () => {
    const connection = new OctoChemConnection();
    const compoundsCollection = await connection.getCollection('compounds');
    while (true) {
      if ((await compoundsCollection.countDocuments()) === 12) {
        break;
      }
    }
    const result = await connection.getCollection('compounds');
    expect(result.namespace).toBe('octochemdb.compounds');
    if (connection) {
      await connection.close();
    }
  },
  { timeout: 30000 },
);
