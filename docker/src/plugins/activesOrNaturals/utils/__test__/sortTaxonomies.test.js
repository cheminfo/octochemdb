import { expect, describe, it } from 'vitest';

import { sortTaxonomies } from '../utilsTaxonomies/sortTaxonomies.js';

describe('sortTaxonomies', () => {
  it('sortTaxonomies', () => {
    const taxonomies = [
      {
        superKingdom: 'eukaryota',
        kingdom: 'Animalia',
        phylum: 'Pseudomonadota',
        class: 'mammalia',
        order: 'primates',
        family: 'hominidae',
        genus: 'Homo',
        species: 'homo sapiens',
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
    const sortedTaxonomies = sortTaxonomies(taxonomies);
    expect(sortedTaxonomies[0]).toMatchInlineSnapshot(`
      {
        "class": "mammalia",
        "family": "hominidae",
        "genus": "Homo",
        "kingdom": "Animalia",
        "order": "primates",
        "phylum": "chordata",
        "species": "homo sapiens",
        "superKingdom": "eukaryota",
      }
    `);
  });
  it('empty fields', () => {
    const taxonomies = [
      {
        superKingdom: 'Bacteria',
        kingdom: 'Animalia',
        phylum: 'Pseudomonadota',
        class: 'Gammaproteobacteria',
        order: 'enterobacteria',
        family: '',
        genus: 'enterobacteria',
        species: 'Escherichia coli',
      },
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
    ];

    const sortedTaxonomies = sortTaxonomies(taxonomies);
    expect(sortedTaxonomies[0]).toMatchInlineSnapshot(`
      {
        "class": "Gammaproteobacteria",
        "family": "enterobacteria",
        "genus": "enterobacteria",
        "kingdom": "",
        "order": "enterobacteria",
        "phylum": "Pseudomonadota",
        "species": "Escherichia coli",
        "superKingdom": "Bacteria",
      }
    `);
  });
});
