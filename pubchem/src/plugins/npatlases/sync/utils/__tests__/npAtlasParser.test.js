import { readFileSync } from 'fs';
import { join } from 'path';

import { parseNpatlases } from '../parseNpatlases.js';

test('parseNpatlases', () => {
  const json = readFileSync(
    join(__dirname, 'data/NPAtlas_download.json'),
    'utf8',
  );
  const results = parseNpatlases(JSON.parse(json));
  expect(results[0]).toStrictEqual({
    _id: 'NPA000001',
    data: {
      ocl: {
        id: 'ficaP@D@tZK\\bbRbTRdQT\\VfZfjjjjjjXRLPiZIUU@d@',
        coordinates:
          '!B?g~w_Xa}mpJH@k]}?`BH_[\\B?g~H?Oy?b@Jw?[]}bGw~@Ha}b@K~_xa}?g~H@ha}',
        noStereoID: 'ficaP@D@tZK\\bbRbTRdQT\\VfZfjjjjjj@@',
      },
      taxonomies: [
        {
          doi: '10.1002/chem.201000652',
          genusID: 5502,
          genus: 'Curvularia',
          species: 'Curvularia geniculata',
        },
      ],

      iupacName: 'Curvularide C',
    },
  });
});
