import { readFileSync } from 'fs';
import { join } from 'path';

import { parseNpatlases } from '../parseNpatlases.js';

test('parseNpatlases', async () => {
  const json = readFileSync(
    join(__dirname, 'data/NPAtlas_download.json'),
    'utf8',
  );

  let results = [];
  for await (const entry of parseNpatlases(JSON.parse(json))) {
    results.push(entry);
  }
  expect(results[0]).toStrictEqual({
    _id: 'NPA000001',
    data: {
      ocl: {
        id: 'ficaP@D@tZK\\bbRbTRdQT\\VfZfjjjjjjXRLPiZIUU@d@',
        noStereoID: 'ficaP@D@tZK\\bbRbTRdQT\\VfZfjjjjjj@@',
      },
      taxonomies: [
        {
          genusID: 5502,
          genus: 'Curvularia',
          species: 'Curvularia geniculata',
          kingdom: 'Fungi',
          phylum: 'Ascomycota',
          class: 'Dothideomycetes',
          family: 'Pleosporaceae',
          doi: '10.1002/chem.201000652',
        },
      ],
      iupacName: 'Curvularide C',
    },
  });
});
