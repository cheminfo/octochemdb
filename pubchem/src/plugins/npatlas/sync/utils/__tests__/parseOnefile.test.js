import { readFileSync } from 'fs';
import { join } from 'path';

import { parseOnefile } from '../parseOnefile.js';

describe('parseOneFile', () => {
  it('small file', () => {
    const json = readFileSync(
      join(__dirname, 'data/NPAtlas_download.json'),
      'utf8',
    );
    const results = parseOnefile(JSON.parse(json));

    expect(results[0]).toStrictEqual({
      ocl: {
        id: 'ficaP@D@tZK\\bbRbTRdQT\\VfZfjjjjjjXRLPiZIUU@d@',
        coordinates:
          '!B?g~w_Xa}mpJH@k]}?`BH_[\\B?g~H?Oy?b@Jw?[]}bGw~@Ha}b@K~_xa}?g~H@ha}',
        noStereoID: 'ficaP@D@tZK\\bbRbTRdQT\\VfZfjjjjjj@@',
      },
      origin: {
        taxonomy: {
          id: 1,
          type: 'Fungus',
          genus: 'Curvularia',
          species: 'geniculata',
          taxon: {
            id: 652,
            name: 'Curvularia',
            rank: 'genus',
            taxon_db: 'mycobank',
            external_id: '7847',
            ncbi_id: 5502,
            ancestors: [
              {
                id: 599,
                name: 'Eukarya',
                rank: 'domain',
                taxon_db: 'mycobank',
                external_id: '0',
                ncbi_id: 2759,
              },
              {
                id: 600,
                name: 'Fungi',
                rank: 'kingdom',
                taxon_db: 'mycobank',
                external_id: '90157',
                ncbi_id: 4751,
              },
              {
                id: 617,
                name: 'Ascomycota',
                rank: 'phylum',
                taxon_db: 'mycobank',
                external_id: '90031',
                ncbi_id: 4890,
              },
              {
                id: 618,
                name: 'Dothideomycetes',
                rank: 'class',
                taxon_db: 'mycobank',
                external_id: '501481',
                ncbi_id: 147541,
              },
              {
                id: 645,
                name: 'Pleosporales',
                rank: 'order',
                taxon_db: 'mycobank',
                external_id: '90563',
                ncbi_id: 92860,
              },
              {
                id: 648,
                name: 'Pleosporaceae',
                rank: 'family',
                taxon_db: 'mycobank',
                external_id: '81188',
                ncbi_id: 28556,
              },
            ],
          },
        },
        doi: '10.1002/chem.201000652',
      },
    });
  });
});
