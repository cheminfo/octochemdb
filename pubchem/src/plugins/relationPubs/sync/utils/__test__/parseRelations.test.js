import { parseRelations } from '../parseRelations.js';
import { join } from 'path';
// patent identifier
jest.setTimeout(144000);
test('parseRelations', async () => {
  const pmidTocid = join(__dirname, 'data/cidTopmidTest.txt');
  const cidTopatent = join(__dirname, 'data/cidTopatentTest.txt');
  const cidTosid = join(__dirname, 'data/cidTosidTest.txt');

  let results = [];
  for await (const entry of parseRelations(pmidTocid, cidTosid, cidTopatent)) {
    results.push(entry);
  }

  expect(results[1710]).toStrictEqual({
    cid: '6',
    sids: [
      '1917',
      '72281',
      '598708',
      '3136115',
      '5254507',
      '7675940',
      '8150407',
      '10538855',
      '15220052',
      '17395397',
      '22389130',
      '24848362',
      '24854237',
      '26757478',
      '36535158',
      '48413412',
      '48417000',
      '49856122',
      '50183835',
      '51073324',
      '53787752',
      '57260144',
      '57264331',
      '57319883',
      '58023885',
      '85084731',
      '85084732',
      '85172477',
      '85240164',
      '87565336',
      '88800368',
      '93166146',
      '103110650',
      '103249990',
      '104293572',
      '104667369',
      '117377587',
      '117558395',
      '124800650',
      '124892793',
      '124892794',
      '125324001',
      '126653061',
      '126678588',
      '128846853',
      '129547292',
      '134972702',
      '135579687',
      '136979492',
      '136998194',
      '140268049',
      '143434738',
      '143857576',
      '144209154',
      '144213119',
      '160808350',
      '160873984',
      '162043205',
      '162300061',
      '162755179',
      '170002790',
      '171578256',
      '174556948',
      '175442032',
      '176323347',
      '179226220',
      '196109683',
      '198976175',
      '202827749',
      '204416026',
      '207114814',
      '208014086',
      '223509658',
      '223686344',
      '223737147',
      '226424659',
      '241175448',
      '249549182',
      '249742408',
      '249897493',
      '252361524',
      '252403968',
      '253652668',
      '254812275',
      '255370947',
      '256202847',
      '275845008',
      '276772840',
      '292903429',
      '312238230',
      '312605294',
      '313533218',
      '315350126',
      '315671262',
      '316394917',
      '316603895',
      '316607549',
      '318049400',
      '318240760',
      '318692002',
      '321914792',
      '329596284',
      '329775045',
      '329775047',
      '329991186',
      '340508297',
      '340513453',
      '341145472',
      '342389825',
      '342582313',
      '346446464',
      '346533352',
      '347828177',
      '349512540',
      '349991914',
      '355072062',
      '363602153',
      '363890251',
      '363899749',
      '371981048',
      '373674721',
      '374001928',
      '374188959',
      '375142123',
      '375580317',
      '375641349',
      '376591807',
      '381001113',
      '381002613',
      '381019383',
      '381344999',
      '383277564',
      '385647684',
      '386264322',
      '386484090',
      '387167651',
      '403032691',
      '403693018',
      '404736657',
      '404754073',
      '404795811',
      '406183915',
      '406662475',
      '419555980',
      '433925786',
      '434433211',
      '438602189',
      '438791096',
      '441083536',
      '441294290',
      '441631138',
      '442067053',
      '443533731',
      '444166869',
      '446828489',
      '447218458',
      '458981892',
      '459193858',
      '459198270',
      '459198271',
      '459227987',
      '459227988',
      '459227989',
      '461595487',
      '37229089',
      '160697065',
      '234425015',
      '234425018',
      '234426244',
      '236949558',
      '244814671',
      '348116261',
      '348116262',
      '377215394',
      '387492228',
      '397468976',
      '401157578',
      '447566834',
      '447566984',
      '447577057',
      '447700661',
      '447909192',
      '448103670',
      '448103876',
      '448172085',
      '448176627',
      '448208170',
      '448223012',
      '448233988',
      '448258924',
      '448288163',
      '448289533',
      '448391592',
      '448564290',
      '448566474',
      '448611065',
      '448640674',
      '448678355',
      '448680110',
      '448685824',
      '448795854',
      '448855650',
      '449019091',
      '449062432',
      '449255934',
      '449319376',
      '449347132',
      '449383546',
      '449488134',
      '449490785',
      '449511514',
      '449653296',
      '449717529',
      '449728203',
      '449754701',
      '449878003',
      '449896422',
      '449957888',
      '449984959',
      '450117180',
      '450172252',
      '450256342',
      '450370717',
      '450389229',
      '450456057',
      '450513164',
      '450607744',
      '450719975',
      '450910261',
      '450913032',
      '450965503',
      '451047814',
      '451178682',
      '451348135',
      '451354257',
      '451375789',
      '451439118',
      '451442022',
      '451684233',
      '451839812',
      '451888830',
      '451903670',
      '451962650',
      '451989271',
      '452320127',
      '452337434',
      '452372390',
      '452459881',
      '452464852',
      '452511520',
      '452602477',
      '452602622',
      '452607767',
      '452635736',
      '452647288',
      '452686111',
      '452837017',
      '452893140',
      '452910169',
      '452923092',
      '453141100',
      '453250245',
      '453364276',
      '453428878',
      '453569558',
      '453593264',
      '453657580',
      '453741551',
      '453792708',
      '453918263',
      '453978404',
      '453986645',
      '454195722',
      '454295931',
      '454327251',
      '454331973',
      '454431804',
      '454452857',
      '454683604',
      '454691024',
    ],
    pmids: ['15801723'],
    patents: ['KR-102280509-B1'],
  });
});
