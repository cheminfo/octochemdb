import { readFileSync } from 'fs';
import { join } from 'path';

import { parseCoconut } from '../parseCoconut.js';

describe('parseCoconut', () => {
  it('small file', () => {
    const json = readFileSync(join(__dirname, 'data/coconut.json'), 'utf8');
    const results = parseCoconut(JSON.parse(json));

    expect(results[0]).toStrictEqual({
      ocl: {
        id: 'fgAP@@@LrQQJEIITxJQk@QE@@@@@',
        coordinates: '!Bm?vH?_y?m?s~_{lkbOwRsyg_s\\|lYrqgs\\|',
        noStereoID: 'fgAP@@@LrQQJEIITxJQk@QE@@@@@',
        nameCompound: [
          'passiflorin',
          ' loturine',
          ' locuturine',
          ' locuturin',
          ' L-methylpyridobindole',
          ' harmane',
          ' Harman',
          ' aribine',
          ' aribin',
          ' 1-methylnorharman',
          ' 1-methyl-beta-carboline',
          ' 1-methyl-9H-beta-carboline',
          ' 1-methyl-2-carboline',
        ],
        cas: '486-84-0',
      },
      origin: {
        taxonomy: ['Eukaryota$$$$class', 'Eukaryota$$$$kingdom', 'Bacteria'],
      },
    });
  });
});
