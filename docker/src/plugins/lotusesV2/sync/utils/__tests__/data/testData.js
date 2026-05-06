/**
 * Returns mock SPARQL result bindings that mimic the Wikidata SPARQL response
 * format. This replaces live Wikidata queries during tests.
 *
 * The data mirrors the structure returned by the SPARQL endpoint:
 * each binding has `{ value, type }` objects for each variable.
 *
 * @returns {LotusV2TestData}
 */
export function getTestData() {
  return {
    compounds: [
      // Caffeine
      binding('compound_id', 'http://www.wikidata.org/entity/Q60235', {
        canonicalSmiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
        inchikey: 'RYYVLZVUVIJVGH-UHFFFAOYSA-N',
        inchi:
          'InChI=1S/C8H10N4O2/c1-10-4-9-6-5(10)7(13)12(3)8(14)11(6)2/h4H,1-3H3',
        isomericSmiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
      }),
      // Aspirin
      binding('compound_id', 'http://www.wikidata.org/entity/Q18216', {
        canonicalSmiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
        inchikey: 'BSYNRYMUTXBXSQ-UHFFFAOYSA-N',
        inchi:
          'InChI=1S/C9H8O4/c1-6(10)13-8-5-3-2-4-7(8)9(11)12/h2-5H,1H3,(H,11,12)',
      }),
      // Quercetin
      binding('compound_id', 'http://www.wikidata.org/entity/Q186474', {
        canonicalSmiles: 'C1=CC(=C(C=C1C2=C(C(=O)C3=C(C=C(C=C3O2)O)O)O)O)O',
        inchikey: 'REFJWTPEDVJJIY-UHFFFAOYSA-N',
      }),
      // Curcumin
      binding('compound_id', 'http://www.wikidata.org/entity/Q312266', {
        canonicalSmiles:
          'COC1=CC(=CC(=C1O)OC)C=CC(=O)CC(=O)C=CC2=CC(=C(C=C2)O)OC',
        inchikey: 'VFLDPWHFBUODDF-UHFFFAOYSA-N',
      }),
      // Morphine
      binding('compound_id', 'http://www.wikidata.org/entity/Q81225', {
        canonicalSmiles: 'CN1CCC23C4C1CC5=C2C(=C(C=C5)O)OC3C(C=C4)O',
        inchikey: 'BQJCRHHNABKAKU-UHFFFAOYSA-N',
      }),
      // Resveratrol
      binding('compound_id', 'http://www.wikidata.org/entity/Q185782', {
        canonicalSmiles: 'C1=CC(=CC=C1/C=C/C2=CC(=CC(=C2)O)O)O',
        inchikey: 'LUKBXSAWLPMMSZ-OWOJBTEDSA-N',
        isomericSmiles: 'C1=CC(=CC=C1/C=C/C2=CC(=CC(=C2)O)O)O',
      }),
      // Gallic acid
      binding('compound_id', 'http://www.wikidata.org/entity/Q192284', {
        canonicalSmiles: 'C1=C(C=C(C(=C1O)O)O)C(=O)O',
        inchikey: 'LNTHITQWFMADLM-UHFFFAOYSA-N',
      }),
      // Theobromine
      binding('compound_id', 'http://www.wikidata.org/entity/Q206887', {
        canonicalSmiles: 'CN1C=NC2=C1C(=O)NC(=O)N2C',
        inchikey: 'YAPQBXQYLJRXSA-UHFFFAOYSA-N',
      }),
      // Capsaicin
      binding('compound_id', 'http://www.wikidata.org/entity/Q326677', {
        canonicalSmiles: 'CC(C)C=CCCCCC(=O)NCC1=CC(=C(C=C1)O)OC',
        inchikey: 'YKPUWZUDDOIDPM-SOFGYWHQSA-N',
      }),
      // Nicotine
      binding('compound_id', 'http://www.wikidata.org/entity/Q12144', {
        canonicalSmiles: 'CN1CCCC1C2=CN=CC=C2',
        inchikey: 'SNICXCGAKADSCV-JTQLQIEISA-N',
      }),
      // Eugenol
      binding('compound_id', 'http://www.wikidata.org/entity/Q407646', {
        canonicalSmiles: 'COC1=C(C=CC(=C1)CC=C)O',
        inchikey: 'RRAFCDWBNXTKKO-UHFFFAOYSA-N',
      }),
      // Limonene
      binding('compound_id', 'http://www.wikidata.org/entity/Q170782', {
        canonicalSmiles: 'CC1=CCC(CC1)C(=C)C',
        inchikey: 'XMGQYMWWDOXHJM-UHFFFAOYSA-N',
      }),
      // Vanillin
      binding('compound_id', 'http://www.wikidata.org/entity/Q33495', {
        canonicalSmiles: 'COC1=C(C=CC(=C1)C=O)O',
        inchikey: 'MWOOGOJBHIARFG-UHFFFAOYSA-N',
      }),
      // Catechin
      binding('compound_id', 'http://www.wikidata.org/entity/Q408432', {
        canonicalSmiles: 'C1C(C(OC2=CC(=CC(=C21)O)O)C3=CC(=C(C=C3)O)O)O',
        inchikey: 'PFTAWBLQPZVEMU-UHFFFAOYSA-N',
      }),
      // Menthol
      binding('compound_id', 'http://www.wikidata.org/entity/Q407418', {
        canonicalSmiles: 'CC1CCC(C(C1)O)C(C)C',
        inchikey: 'NOOLISFMXDJSKH-UHFFFAOYSA-N',
      }),
      // Salicin
      binding('compound_id', 'http://www.wikidata.org/entity/Q407682', {
        canonicalSmiles: 'C1=CC=C(C(=C1)CO)OC2C(C(C(C(O2)CO)O)O)O',
        inchikey: 'NGFMICBWJRZIBI-UJPOAAIJSA-N',
      }),
      // Gingerol
      binding('compound_id', 'http://www.wikidata.org/entity/Q3487371', {
        canonicalSmiles: 'CCCCCC(CC(=O)CCC1=CC(=C(C=C1)O)OC)O',
        inchikey: 'NLDDIKRKFXEWBK-UHFFFAOYSA-N',
      }),
      // Piperine
      binding('compound_id', 'http://www.wikidata.org/entity/Q311355', {
        canonicalSmiles: 'C1CC(=O)N(C1)C(=O)C=CC=CC2=CC3=C(C=C2)OCO3',
        inchikey: 'MXXWOMGUGJBKIW-YPCIICBESA-N',
      }),
      // Berberine
      binding('compound_id', 'http://www.wikidata.org/entity/Q60998', {
        canonicalSmiles: 'COC1=CC=C2C=C3C=CC4=CC5=C(C=C4C=C3C(=C2C1=O)O)OCO5',
        inchikey: 'YBHILYKTIRIDON-UHFFFAOYSA-O',
      }),
      // Artemisinin
      binding('compound_id', 'http://www.wikidata.org/entity/Q254931', {
        canonicalSmiles: 'CC1CCC2C(C(=O)OC3OC4(C(CC13)OO4)C)CC(O2)C',
        inchikey: 'BLUAFEHZUWYNDE-NNWCWBAJSA-N',
      }),
      // Epigallocatechin gallate
      binding('compound_id', 'http://www.wikidata.org/entity/Q410349', {
        canonicalSmiles:
          'C1C(C(OC2=CC(=CC(=C21)O)O)C3=CC(=C(C=C3)O)O)OC(=O)C4=CC(=C(C(=C4)O)O)O',
        inchikey: 'WMBWREPUVVBILR-UHFFFAOYSA-N',
      }),
      // Camphor
      binding('compound_id', 'http://www.wikidata.org/entity/Q181322', {
        canonicalSmiles: 'CC1(C2CCC1(CC2=O)C)C',
        inchikey: 'DSSYKIVIOFKYAU-UHFFFAOYSA-N',
      }),
      // Colchicine
      binding('compound_id', 'http://www.wikidata.org/entity/Q326225', {
        canonicalSmiles:
          'CC(=O)NC1CCC2=CC(=C(C(=C2C3=CC=C(C(=O)C=C31)OC)OC)OC)OC',
        inchikey: 'IAKHMKGGTNLKSZ-INIZCTEOSA-N',
      }),
      // Taxol (Paclitaxel)
      binding('compound_id', 'http://www.wikidata.org/entity/Q423762', {
        canonicalSmiles:
          'CC1=C2C(C(=O)C3(C(CC4C(C3C(C(C2(C)C)(CC1OC(=O)C(C5=CC=CC=C5)NC(=O)C6=CC=CC=C6)O)OC(=O)C7=CC=CC=C7)(CO4)OC(=O)C)O)C)OC(=O)C',
        inchikey: 'RCINICONZNJXQF-MZXODVADSA-N',
      }),
      // Lycopene
      binding('compound_id', 'http://www.wikidata.org/entity/Q306138', {
        canonicalSmiles:
          'CC(=CCCC(=CC=CC(=CC=CC(=CC=CC=C(C)C=CC=C(C)C=CC=C(C)C)C)C)C)C',
        inchikey: 'OAIJSZIZWZSQBC-GYZMGTCESA-N',
      }),
    ],
    taxa: [
      taxonBinding('http://www.wikidata.org/entity/Q34740', 'Coffea', 'genus'),
      taxonBinding(
        'http://www.wikidata.org/entity/Q158695',
        'Coffea arabica',
        'species',
      ),
      taxonBinding('http://www.wikidata.org/entity/Q25284', 'Salix', 'genus'),
      taxonBinding('http://www.wikidata.org/entity/Q21187', 'Curcuma', 'genus'),
      taxonBinding(
        'http://www.wikidata.org/entity/Q146118',
        'Curcuma longa',
        'species',
      ),
      taxonBinding('http://www.wikidata.org/entity/Q26944', 'Papaver', 'genus'),
      taxonBinding('http://www.wikidata.org/entity/Q25235', 'Vitis', 'genus'),
      taxonBinding(
        'http://www.wikidata.org/entity/Q145643',
        'Capsicum',
        'genus',
      ),
      taxonBinding(
        'http://www.wikidata.org/entity/Q17004',
        'Nicotiana',
        'genus',
      ),
      taxonBinding(
        'http://www.wikidata.org/entity/Q26614',
        'Syzygium',
        'genus',
      ),
      taxonBinding('http://www.wikidata.org/entity/Q81513', 'Citrus', 'genus'),
      taxonBinding(
        'http://www.wikidata.org/entity/Q183350',
        'Vanilla',
        'genus',
      ),
      taxonBinding(
        'http://www.wikidata.org/entity/Q42338',
        'Camellia',
        'genus',
      ),
      taxonBinding('http://www.wikidata.org/entity/Q160495', 'Mentha', 'genus'),
      taxonBinding('http://www.wikidata.org/entity/Q133544', 'Piper', 'genus'),
      taxonBinding(
        'http://www.wikidata.org/entity/Q128006',
        'Berberis',
        'genus',
      ),
      taxonBinding(
        'http://www.wikidata.org/entity/Q84150',
        'Artemisia',
        'genus',
      ),
      taxonBinding(
        'http://www.wikidata.org/entity/Q146439',
        'Zingiber',
        'genus',
      ),
      taxonBinding(
        'http://www.wikidata.org/entity/Q132629',
        'Colchicum',
        'genus',
      ),
      taxonBinding('http://www.wikidata.org/entity/Q127933', 'Taxus', 'genus'),
      taxonBinding('http://www.wikidata.org/entity/Q20638', 'Solanum', 'genus'),
    ],
    references: [
      refBinding(
        'http://www.wikidata.org/entity/Q100001',
        '10.1234/test001',
        'Chemical compounds in Coffea arabica',
      ),
      refBinding(
        'http://www.wikidata.org/entity/Q100002',
        '10.1234/test002',
        'Bioactive molecules from Curcuma longa',
      ),
      refBinding(
        'http://www.wikidata.org/entity/Q100003',
        '10.1234/test003',
        'Alkaloids of Papaver somniferum',
      ),
      refBinding(
        'http://www.wikidata.org/entity/Q100004',
        '10.1234/test004',
        'Polyphenols in Vitis vinifera',
      ),
      refBinding(
        'http://www.wikidata.org/entity/Q100005',
        '10.1234/test005',
        'Natural products from Capsicum species',
      ),
      refBinding(
        'http://www.wikidata.org/entity/Q100006',
        '10.1234/test006',
        'Nicotiana alkaloid biosynthesis',
      ),
      refBinding(
        'http://www.wikidata.org/entity/Q100007',
        '10.1234/test007',
        'Essential oils of Syzygium aromaticum',
      ),
      refBinding(
        'http://www.wikidata.org/entity/Q100008',
        '10.1234/test008',
        'Citrus terpenes review',
      ),
      refBinding(
        'http://www.wikidata.org/entity/Q100009',
        '10.1234/test009',
        'Tea catechins and health',
      ),
      refBinding(
        'http://www.wikidata.org/entity/Q100010',
        '10.1234/test010',
        'Antimalarial natural products',
      ),
    ],
    compoundReferenceTaxon: [
      crtBinding('Q60235', 'Q34740', 'Q100001'),
      crtBinding('Q60235', 'Q158695', 'Q100001'),
      crtBinding('Q206887', 'Q34740', 'Q100001'),
      crtBinding('Q18216', 'Q25284', null),
      crtBinding('Q186474', 'Q25235', 'Q100004'),
      crtBinding('Q312266', 'Q146118', 'Q100002'),
      crtBinding('Q312266', 'Q21187', 'Q100002'),
      crtBinding('Q81225', 'Q26944', 'Q100003'),
      crtBinding('Q185782', 'Q25235', 'Q100004'),
      crtBinding('Q192284', 'Q42338', 'Q100009'),
      crtBinding('Q326677', 'Q145643', 'Q100005'),
      crtBinding('Q12144', 'Q17004', 'Q100006'),
      crtBinding('Q407646', 'Q26614', 'Q100007'),
      crtBinding('Q170782', 'Q81513', 'Q100008'),
      crtBinding('Q33495', 'Q183350', null),
      crtBinding('Q408432', 'Q42338', 'Q100009'),
      crtBinding('Q407418', 'Q160495', null),
      crtBinding('Q407682', 'Q25284', null),
      crtBinding('Q3487371', 'Q146439', null),
      crtBinding('Q311355', 'Q133544', null),
      crtBinding('Q60998', 'Q128006', null),
      crtBinding('Q254931', 'Q84150', 'Q100010'),
      crtBinding('Q410349', 'Q42338', 'Q100009'),
      crtBinding('Q181322', 'Q81513', null),
      crtBinding('Q326225', 'Q132629', null),
      crtBinding('Q423762', 'Q127933', null),
      crtBinding('Q306138', 'Q20638', null),
    ],
  };
}

/**
 * Creates a SPARQL compound binding row.
 *
 * @param {string} idField
 * @param {string} idValue
 * @param {Record<string, string>} fields
 * @returns {LotusV2SparqlBinding}
 */
function binding(idField, idValue, fields) {
  const row = {
    [idField]: { value: idValue, type: 'uri' },
  };
  if (fields.canonicalSmiles) {
    row.canonicalSmiles = { value: fields.canonicalSmiles, type: 'literal' };
  }
  if (fields.isomericSmiles) {
    row.isomericSmiles = { value: fields.isomericSmiles, type: 'literal' };
  }
  if (fields.inchi) {
    row.inchi = { value: fields.inchi, type: 'literal' };
  }
  if (fields.inchikey) {
    row.inchikey = { value: fields.inchikey, type: 'literal' };
  }
  return row;
}

/**
 * @param {string} uri
 * @param {string} name
 * @param {string} rank
 * @returns {LotusV2SparqlBinding}
 */
function taxonBinding(uri, name, rank) {
  /* eslint-disable camelcase */
  return {
    taxon_id: { value: uri, type: 'uri' },
    taxon_name: { value: name, type: 'literal' },
    taxon_rank: { value: rank, type: 'literal' },
  };
  /* eslint-enable camelcase */
}

/**
 * @param {string} uri
 * @param {string} doi
 * @param {string} title
 * @returns {LotusV2SparqlBinding}
 */
function refBinding(uri, doi, title) {
  /* eslint-disable camelcase */
  return {
    article_id: { value: uri, type: 'uri' },
    doi: { value: doi, type: 'literal' },
    title: { value: title, type: 'literal' },
  };
  /* eslint-enable camelcase */
}

/**
 * @param {string} compound
 * @param {string} taxon
 * @param {string | null} reference
 * @returns {LotusV2SparqlBinding}
 */
function crtBinding(compound, taxon, reference) {
  /* eslint-disable camelcase */
  const row = {
    compound_id: {
      value: `http://www.wikidata.org/entity/${compound}`,
      type: 'uri',
    },
    taxon_id: {
      value: `http://www.wikidata.org/entity/${taxon}`,
      type: 'uri',
    },
  };
  if (reference) {
    row.reference_id = {
      value: `http://www.wikidata.org/entity/${reference}`,
      type: 'uri',
    };
  }
  /* eslint-enable camelcase */
  return row;
}
