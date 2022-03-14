import { join } from 'path';

import { ncbiTaxonomyConvert } from '../ncbiTaxonomyConvert';

describe('convertNpass', () => {
  it('simple case', async () => {
    const result = await ncbiTaxonomyConvert(join(__dirname, 'data'));
    //   console.log(JSON.stringify(result[0]));
    //  expect(result[0]).toStrictEqual();
  });
});
