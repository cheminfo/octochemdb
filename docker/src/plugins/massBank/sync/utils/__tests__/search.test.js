import { describe, it, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/search.js';

describe('search (massBank)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('massBank');
    if ((await collection.countDocuments()) === 2) {
      break;
    }
  }
  it('em (massBank)', async () => {
    const request = {
      query: {
        em: '287.1157, 318.146',
        fields: 'data',
      },
    };
    const results = await search.handler(request);
    // @ts-ignore
    expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
      [
        "ocl",
        "spectrum",
        "em",
        "mf",
      ]
    `);
    expect(results.data).toMatchSnapshot();
  });
  it('masses (massBank)', async () => {
    const request = {
      query: {
        masses: '125.02,229.08',
        precision: 100,
        fields: 'data',
      },
    };
    const results = await search.handler(request);
    // @ts-ignore
    expect(Object.keys(results.data)).toHaveLength(1);
    expect(results.data).toMatchSnapshot();
  });
  it('mf (massBank)', async () => {
    const request = {
      query: {
        mf: 'C18H22O5',
        fields: 'data',
      },
    };
    const results = await search.handler(request);
    // @ts-ignore
    expect(Object.keys(results.data)).toHaveLength(1);
    expect(results.data).toMatchSnapshot();
  });
  await connection.close();
});
