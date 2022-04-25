import { join } from 'path';

import { parseCoconuts } from '../parseCoconuts.js';

test('parseCoconuts', async () => {
  const bsonPath = join(__dirname, 'data/testCoconut.bson');
  const results = [];
  for await (const result of parseCoconuts(bsonPath)) {
    results.push(result);
  }
  expect(results[3]).toStrictEqual({
    _id: 'CNP0330764',
    data: {
      ocl: {
        id: 'eghPJ@@@D@cklbbRbbbdjdUdJtffcgbVQPrsTuSUUUUUSUP@@',
        coordinates:
          '!B?l]kcQRMZ{HTlmlUd]c~vARMJX]CkHt@qKzGUcv`NXa\\`l^n`hpx\\RUDG?ZBcHJLNGDeQEh{VcnBc@',
        noStereoID: 'eghPJ@@@D@cklbbRbbbdjdUdJtffcgbVQPrsTuSUUUUUSUP@@',
      },
      taxonomies: [
        { species: 'Adenocarpus foliolosus' },
        { species: 'Piper taboganum' },
        { species: 'Microglossa pyrrhopappa' },
        { species: 'Betula exilis' },
        { species: 'Rubia schumanniana' },
        { species: 'Polygala reinii' },
        { species: 'plants' },
        { species: 'Ipomoea reptans' },
        { species: 'Anthoxanthum nitens' },
        { species: 'Sabal causiarum' },
        { species: 'Retama duriaei' },
        { species: 'Oreoherzogia fallax' },
        { species: 'Ichthyothere terminalis' },
        { species: 'Chromolaena arnottiana' },
        { species: 'Clethra macrophylla' },
      ],

      iupacName:
        '10-hydroxy-5,9-dimethyl-15-[(3-methylbut-2-enoyl)oxy]-14-methylidenetetracyclo[11.2.1.0¹,¹⁰.0⁴,⁹]hexadecane-5-carboxylic acid',
    },
  });
});
