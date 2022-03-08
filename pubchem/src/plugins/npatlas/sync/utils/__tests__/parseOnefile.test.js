import { readFileSync } from 'fs';
import { join } from 'path';

import { parseOnefile } from '../parseOnefile.js';

describe('parseOneFile', () => {
  it('small file', () => {
    const json = readFileSync(join(__dirname, 'data/NPAtlas.json'), 'utf8');
    const results = parseOnefile(JSON.parse(json));
    console.log(results);
  });
});
