import { join } from 'path';

import { parseLotuses } from '../parseLotuses.js';

test('parseLotuses', async () => {
  const bsonPath = join(__dirname, 'data', 'testLotus.bson.zip');
  const results = [];
  let fileName = 'testLotus.bson';
  for await (const result of parseLotuses(bsonPath, fileName)) {
    results.push(result);
  }
  expect(results[0]).toStrictEqual({
    _id: 'LTS0257199',
    data: {
      ocl: {
        idCode:
          'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjkrBHPaTKaRSrUPZSKZWHEXqe@@',
        noStereoID:
          'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
      },
      iupacName:
        '(2R,3S,4R,5R,6R)-2-(hydroxymethyl)-6-{[(1R,4S,5S,8R,9R,12S,13S,16S)-8-[(2R,4S)-4-methoxy-6-methylhept-5-en-2-yl]-5,9,17,17-tetramethyl-18-oxapentacyclo[10.5.2.0¹,¹³.0⁴,¹².0⁵,⁹]nonadec-2-en-16-yl]oxy}oxane-3,4,5-triol',
      taxonomies: {
        ncbi: [
          {
            organismID: '3673',
            kingdom: 'Viridiplantae',
            phylum: 'Streptophyta',
            class: 'Magnoliopsida',
            family: 'Cucurbitaceae',
            genus: 'Momordica',
            species: 'Momordica charantia',
          },
        ],
        gBifBackboneTaxonomy: [
          {
            organismID: '7631078',
            kingdom: 'Plantae',
            phylum: 'Tracheophyta',
            class: 'Magnoliopsida',
            family: 'Cucurbitaceae',
            genus: 'Momordica',
            species: 'Momordica charantia',
          },
        ],
        iNaturalist: [
          {
            organismID: '61369',
            kingdom: 'Plantae',
            phylum: 'Tracheophyta',
            class: 'Magnoliopsida',
            family: 'Cucurbitaceae',
            genus: 'Momordica',
            species: 'Momordica charantia',
          },
        ],
        openTreeOfLife: [
          {
            organismID: '955521',
            kingdom: 'Archaeplastida',
            phylum: 'Streptophyta',
            class: 'Magnoliopsida',
            family: 'Cucurbitaceae',
            genus: 'Momordica',
            species: 'Momordica charantia',
          },
        ],
        iTIS: [
          {
            organismID: '22399',
            kingdom: 'Plantae',
            class: 'Magnoliopsida',
            family: 'Cucurbitaceae',
            genus: 'Momordica',
            species: 'Momordica charantia',
          },
        ],
      },
    },
  });
});
