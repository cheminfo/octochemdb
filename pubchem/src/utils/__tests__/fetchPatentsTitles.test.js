import { fetchPatentsTitles } from '../fetchPatentsTitles.js';

jest.setTimeout(30000);
test('Get titles', async () => {
  const patentIDs = [
    'AU-2012294448-A1',
    'GB-1109362-A',
    'RU-2704421-C1',
    'SE-388873-B',
  ];
  let result = {};
  for (let id of patentIDs) {
    result[id] = await fetchPatentsTitles(id);
  }

  expect(result).toStrictEqual({
    'AU-2012294448-A1':
      'Small molecule compounds for the control of nematodes - Patent AU-2012294448-A1 - PubChem',
    'GB-1109362-A':
      'Improvements in fermentation processes for the production of antibiotics from emericellopsis-cephalosporium fungi - Patent GB-1109362-A - PubChem',
    'RU-2704421-C1':
      'Emericellopsis alkalina bilanenko & georgieva - producer of antibiotics - peptaibols with antifungal and antibacterial activity - Patent RU-2704421-C1 - PubChem',
    'SE-388873-B':
      'PREPARATION OF DESACETOXIC PHALOSPORINE C BY CULTIVATION OF ONE OF 20 SPECIFIED SPECIES OF CEPHALOSPORIUM, EMERICELLOPSIS, SCOPULARIOPSIS, PAECILOMYCES OR DIHETEROSPORA - Patent SE-388873-B - PubChem',
  });
});
