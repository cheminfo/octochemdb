import { readFileSync } from 'fs';
import { join } from 'path';

import { parseTaxonomies } from '../parseTaxonomies';

test('taxonomyParser', () => {
  const results = [];
  const arrayBuffer = readFileSync(
    join(__dirname, 'data/rankedLineageTest.dmp'),
  );
  const nodes = readFileSync(join(__dirname, 'data/nodesTest.dmp'));
  for (const entry of parseTaxonomies(arrayBuffer, nodes)) {
    results.push(entry);
  }
  expect(results[600]).toStrictEqual({
    _id: 1175296,
    data: {
      superkingdom: 'Archaea',
      phylum: 'Candidatus Thermoplasmatota',
      class: 'Thermoplasmata',
      order: 'Methanomassiliicoccales',
      family: 'Methanomassiliicoccaceae',
      genus: 'Methanomassiliicoccus',
      species: 'Methanomassiliicoccus luminyensis',
    },
  });
});
