import { test, expect } from 'vitest';

import getTaxonomyKeywords from '../getTaxonomyKeywords';

test(
  'getTaxonomyKeywords',
  () => {
    const taxon = [
      {
        superKingdom: 'Bacteria',
        kingdom: '',
        phylum: 'Pseudomonadota',
        class: 'Gammaproteobacteria',
        order: 'enterobacteria',
        family: 'enterobacteria',
        genus: 'enterobacteria',
        species: 'Escherichia coli',
      },

      {
        superKingdom: 'eukaryota',
        kingdom: 'Animalia',
        phylum: 'chordata',
        class: 'mammalia',
        order: 'primates',
        family: 'hominidae',
        genus: 'Homo',
        species: 'homo sapiens',
      },
    ];
    const keywords = getTaxonomyKeywords(taxon);
    expect(keywords).toStrictEqual([
      'pseudomonadota',
      'gammaproteobacteria',
      'enterobacteria',
      'escherichia',
      'coli',
      'animalia',
      'chordata',
      'mammalia',
      'primates',
      'hominidae',
      'homo',
      'sapiens',
    ]);
  },
  { timeout: 30000 },
);
