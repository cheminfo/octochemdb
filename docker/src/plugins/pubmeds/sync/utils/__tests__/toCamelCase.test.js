import { test, expect } from 'vitest';

import { toCamelCase } from '../toCamelCase.js';

test('toCamelCase', () => {
  let entry = {
    dateCompleted: {
      Year: 1996,
      Month: 12,
      Day: 1,
    },
    dateRevised: {
      Year: 2018,
      Month: 12,
      Day: 1,
    },
    journal: {
      title: 'Orvosi hetilap',
      isoAbbreviation: 'Orv Hetil',
      iSSN: '0030-6002',
      pubDate: {
        Year: 1965,
        Month: 'Jan',
        Day: 3,
      },
    },
    journalInfo: {
      Country: 'Hungary',
      MedlineTA: 'Orv Hetil',
      NlmUniqueID: 376412,
      ISSNLinking: '0030-6002',
    },
  };
  let result = toCamelCase(entry);
  expect(result).toMatchInlineSnapshot(`
    {
      "dateCompleted": {
        "day": 1,
        "month": 12,
        "year": 1996,
      },
      "dateRevised": {
        "day": 1,
        "month": 12,
        "year": 2018,
      },
      "journal": {
        "iSsn": "0030-6002",
      },
      "journalInfo": {
        "country": "Hungary",
        "issnLinking": "0030-6002",
        "medlineTa": "Orv Hetil",
        "nlmUniqueId": 376412,
      },
    }
  `);
});
test('toCamelCase', () => {
  let entry = {
    Country: 'Hungary',
    MedlineTA: 'Orv Hetil',
    NlmUniqueID: 376412,
    ISSNLinking: '0030-6002',
  };
  let result = toCamelCase(entry);
  expect(result).toMatchInlineSnapshot(`
    {
      "country": "Hungary",
      "issnLinking": "0030-6002",
      "medlineTa": "Orv Hetil",
      "nlmUniqueId": 376412,
    }
  `);
});
