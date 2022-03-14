import { readFileSync } from 'fs';
import { join } from 'path';

import { parseLotus } from '../parseLotus.js';

describe('parseLotus', () => {
  it('small file', () => {
    const json = readFileSync(join(__dirname, 'data/lotus.json'), 'utf8');
    const results = parseLotus(JSON.parse(json));

    expect(results[0]).toStrictEqual({
      ocl: {
        id: 'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjkrBHPaTKaRSrUPZSKZWHEXqe@@',
        coordinates:
          '!BM`?d[NlSJNThyTepU~hvC~QlyFsd[NlSRW@hyU_j[NoeU||FIrupZDepb?SYT@}v_qzGFdUHQTcwyfHxlMGQlC\\zLuQGXd\\]?kAGXozpQquGXd]bQqw~l@',
        noStereoID:
          'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
      },
      origin: {
        taxonomy: {
          iNaturalist: [
            {
              cleaned_organism_id: '61369',
              organism_value: 'Momordica charantia',
              kingdom: 'Plantae',
              phylum: 'Tracheophyta',
              classx: 'Magnoliopsida',
              family: 'Cucurbitaceae',
              genus: 'Momordica',
              species: 'Momordica charantia',
              _class:
                'de.unijena.cheminf.lotusfiller.mongocollections.UncomplicatedTaxonomy',
            },
          ],
          ITIS: [
            {
              cleaned_organism_id: '22399',
              organism_value: 'Momordica charantia',
              kingdom: 'Plantae',
              classx: 'Magnoliopsida',
              family: 'Cucurbitaceae',
              genus: 'Momordica',
              species: 'Momordica charantia',
              _class:
                'de.unijena.cheminf.lotusfiller.mongocollections.UncomplicatedTaxonomy',
            },
          ],
          'Open Tree of Life': [
            {
              cleaned_organism_id: '955521',
              organism_value: 'Momordica charantia',
              wikidata_id: 'http://www.wikidata.org/entity/Q428750',
              reference_wikidata_id: 'http://www.wikidata.org/entity/Q34660859',
              domain: 'Eukaryota',
              kingdom: 'Archaeplastida',
              phylum: 'Streptophyta',
              classx: 'Magnoliopsida',
              family: 'Cucurbitaceae',
              genus: 'Momordica',
              species: 'Momordica charantia',
              _class:
                'de.unijena.cheminf.lotusfiller.mongocollections.UncomplicatedTaxonomy',
            },
          ],
          NCBI: [
            {
              cleaned_organism_id: '3673',
              organism_value: 'Momordica charantia',
              superkingdom: 'Eukaryota',
              kingdom: 'Viridiplantae',
              phylum: 'Streptophyta',
              classx: 'Magnoliopsida',
              family: 'Cucurbitaceae',
              genus: 'Momordica',
              species: 'Momordica charantia',
              _class:
                'de.unijena.cheminf.lotusfiller.mongocollections.UncomplicatedTaxonomy',
            },
          ],
          'GBIF Backbone Taxonomy': [
            {
              cleaned_organism_id: '7631078',
              organism_value: 'Momordica charantia',
              kingdom: 'Plantae',
              phylum: 'Tracheophyta',
              classx: 'Magnoliopsida',
              family: 'Cucurbitaceae',
              genus: 'Momordica',
              species: 'Momordica charantia',
              _class:
                'de.unijena.cheminf.lotusfiller.mongocollections.UncomplicatedTaxonomy',
            },
          ],
        },
      },
    });
  });
});
