import { readFileSync } from 'fs';
import { join } from 'path';

import { npAtlasParser } from '../npAtlasParser.js';

test('npAtlasParser', () => {
  const json = readFileSync(
    join(__dirname, 'data/NPAtlas_download.json'),
    'utf8',
  );
  const results = npAtlasParser(JSON.parse(json));

  expect(results[0]).toStrictEqual({
    _id: 'ficaP@D@tZK\\bbRbTRdQT\\VfZfjjjjjj@@',
    ocl: {
      id: 'ficaP@D@tZK\\bbRbTRdQT\\VfZfjjjjjjXRLPiZIUU@d@',
      coordinates:
        '!B?g~w_Xa}mpJH@k]}?`BH_[\\B?g~H?Oy?b@Jw?[]}bGw~@Ha}b@K~_xa}?g~H@ha}',
      noStereoID: 'ficaP@D@tZK\\bbRbTRdQT\\VfZfjjjjjj@@',
    },
    origin: {
      taxonomy: {
        kingdom: 'Fungi',
        phylum: 'Ascomycota',
        class: 'Dothideomycetes',
        family: 'Pleosporaceae',
        genus: 'Curvularia',
        species: 'Curvulariageniculata',
      },
    },
    doi: '10.1002/chem.201000652',
  });
});
