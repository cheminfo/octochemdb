import { describe, it, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/search.js';

describe('search (gnps)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('gnps');
    if ((await collection.countDocuments()) === 2) {
      break;
    }
  }
  it('em (gnps)', async () => {
    const request = {
      query: {
        em: '980.53,939.45',
        fields: 'data',
      },
    };
    const results = await search.handler(request);
    // @ts-ignore
    expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "spectrum",
      "mf",
      "em",
    ]
  `);
    // @ts-ignore
    delete results.data[0].data.ocl.coordinates;
    // @ts-ignore
    expect(results.data[0].data).toMatchSnapshot();
  });
  it('masses (gnps)', async () => {
    const request = {
      query: {
        masses: '361.84,520.97',
        precision: 100,
        fields: 'data',
      },
    };
    const results = await search.handler(request);
    // @ts-ignore
    expect(Object.keys(results.data)).toHaveLength(1);
    // @ts-ignore
    delete results.data[0].data.ocl.coordinates;
    // @ts-ignore
    expect(results.data[0].data).toMatchSnapshot();
  });
  it('mf (gnps)', async () => {
    const request = {
      query: {
        mf: 'C48H72N10O12',
        fields: 'data',
      },
    };
    const results = await search.handler(request);
    // @ts-ignore
    expect(Object.keys(results.data)).toHaveLength(1);
    // @ts-ignore
    delete results.data[0].data.ocl.coordinates;
    // @ts-ignore
    expect(results.data[0].data).toMatchSnapshot();
  });
  await connection.close();
});
