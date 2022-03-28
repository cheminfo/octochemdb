import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'sdf-parser';

import improveSubstance from '../improveSubstance.js';

test('improveSubstance', () => {
  const molecules = parse(
    readFileSync(join(__dirname, 'data.sdf'), 'utf8'),
  ).molecules;
  const results = [];
  for (let molfile of molecules) {
    results.push(improveSubstance(molfile));
  }
  expect(results).toHaveLength(26);
  delete results[0].data.molfile;
  expect(results[0]).toStrictEqual({
    _id: 584927,
    _seq: 0,
    data: {
      compound: { id: { type: 0 } },
      mmdb: { molecule: { name: 'BEN\nBENZAMIDINE' } },
      total: { charge: 0 },
      substance: {
        id: 584927,
        version: 18,
        comment:
          'PDB Accession Code 1XX4\n' +
          'Crystal Structure of Rat Mitochondrial 3,2-Enoyl-CoA\n' +
          'ISOMERASE\n' +
          'Crystal Structure of Rat Mitochondrial 3,2-Enoyl-CoA; crotonase superfamily, domain swapped, isomerase; Mol_id: 1; Molecule: 3,2-trans-enoyl-CoA isomerase, mitochondrial; Chain: A; Synonym: Dodecenoyl-CoA delta-isomerase; EC number: 5.3.3.8;',
        synonym: 'BENZAMIDINE\nBEN',
      },
      ext: {
        datasource: {
          name: 'MMDB',
          regid: 30768.8,
          url: 'https://www.ncbi.nlm.nih.gov/Structure/MMDB/mmdb.shtml',
        },
        substance: {
          url: 'https://www.ncbi.nlm.nih.gov/Structure/mmdb/mmdbsrv.cgi?uid=30768',
        },
      },
      xref: { ext: { id: 30768.8 } },
      ncbi: { mmdb: { id: 30768 } },
      cid: { associations: '2332  1' },
      conformer: { id: '0008ECDF00120001' },
      coordinate: { type: '2\n3\n4' },
    },
  });
});
