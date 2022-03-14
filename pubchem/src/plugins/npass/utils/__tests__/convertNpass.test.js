import { join } from 'path';

import { convertNpass } from '../convertNpass';

describe('convertNpass', () => {
  it('simple case', () => {
    convertNpass(join(__dirname, 'data'));
  });
});
