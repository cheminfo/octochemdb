import { join } from 'path';

import parseBioactivities from '../parseBioactivities.js';

//remove process.env.TEST from parseBioactivities to use this test
test('parseBioactivities', async () => {
  const activity = join(__dirname, 'data/bioactivities.tsv.gz');
  const bioassays = join(__dirname, 'data/bioassays.tsv.gz');
  let results = [];
  let oldIds = {};
  for await (let result of parseBioactivities(activity, bioassays, oldIds)) {
    results.push(result);
  }
  expect(results).toStrictEqual([
    {
      _id: '59478_1',
      data: {
        cid: '59478',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '61929_1',
      data: {
        cid: '61929',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '67115_1',
      data: {
        cid: '67115',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '68553_1',
      data: {
        cid: '68553',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '76598_1',
      data: {
        cid: '76598',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '77111_1',
      data: {
        cid: '77111',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '77250_1',
      data: {
        cid: '77250',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '80565_1',
      data: {
        cid: '80565',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '81146_1',
      data: {
        cid: '81146',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '81146_1',
      data: {
        cid: '81146',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '84145_1',
      data: {
        cid: '84145',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '88579_1',
      data: {
        cid: '88579',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '89216_1',
      data: {
        cid: '89216',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '90481_1',
      data: {
        cid: '90481',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '95282_1',
      data: {
        cid: '95282',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '96028_1',
      data: {
        cid: '96028',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '96679_1',
      data: {
        cid: '96679',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351335_1',
      data: {
        cid: '5351335',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351409_1',
      data: {
        cid: '5351409',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351514_1',
      data: {
        cid: '5351514',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351641_1',
      data: {
        cid: '5351641',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351669_1',
      data: {
        cid: '5351669',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351722_1',
      data: {
        cid: '5351722',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5354235_1',
      data: {
        cid: '5354235',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '59490_1',
      data: {
        cid: '59490',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '59673_1',
      data: {
        cid: '59673',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '65015_1',
      data: {
        cid: '65015',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '67235_1',
      data: {
        cid: '67235',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '67273_1',
      data: {
        cid: '67273',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '69769_1',
      data: {
        cid: '69769',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '70751_1',
      data: {
        cid: '70751',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '70872_1',
      data: {
        cid: '70872',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '73074_1',
      data: {
        cid: '73074',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '73447_1',
      data: {
        cid: '73447',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '79276_1',
      data: {
        cid: '79276',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '79626_1',
      data: {
        cid: '79626',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '80412_1',
      data: {
        cid: '80412',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '81403_1',
      data: {
        cid: '81403',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '93004_1',
      data: {
        cid: '93004',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '94902_1',
      data: {
        cid: '94902',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '94937_1',
      data: {
        cid: '94937',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '94937_1',
      data: {
        cid: '94937',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351332_1',
      data: {
        cid: '5351332',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351333_1',
      data: {
        cid: '5351333',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351356_1',
      data: {
        cid: '5351356',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351366_1',
      data: {
        cid: '5351366',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351397_1',
      data: {
        cid: '5351397',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351457_1',
      data: {
        cid: '5351457',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '59431_1',
      data: {
        cid: '59431',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '59622_1',
      data: {
        cid: '59622',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '60877_1',
      data: {
        cid: '60877',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '65048_1',
      data: {
        cid: '65048',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '66365_1',
      data: {
        cid: '66365',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '66663_1',
      data: {
        cid: '66663',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '66718_1',
      data: {
        cid: '66718',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '67930_1',
      data: {
        cid: '67930',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '68546_1',
      data: {
        cid: '68546',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '68791_1',
      data: {
        cid: '68791',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '72311_1',
      data: {
        cid: '72311',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '72629_1',
      data: {
        cid: '72629',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '72631_1',
      data: {
        cid: '72631',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '73071_1',
      data: {
        cid: '73071',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '77086_1',
      data: {
        cid: '77086',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '77258_1',
      data: {
        cid: '77258',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '77955_1',
      data: {
        cid: '77955',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '81406_1',
      data: {
        cid: '81406',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '82034_1',
      data: {
        cid: '82034',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '88356_1',
      data: {
        cid: '88356',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '88460_1',
      data: {
        cid: '88460',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '88647_1',
      data: {
        cid: '88647',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '91246_1',
      data: {
        cid: '91246',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '94280_1',
      data: {
        cid: '94280',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351560_1',
      data: {
        cid: '5351560',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351560_1',
      data: {
        cid: '5351560',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351560_1',
      data: {
        cid: '5351560',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351689_1',
      data: {
        cid: '5351689',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5351720_1',
      data: {
        cid: '5351720',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5353599_1',
      data: {
        cid: '5353599',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5357909_1',
      data: {
        cid: '5357909',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5368396_1',
      data: {
        cid: '5368396',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5382104_1',
      data: {
        cid: '5382104',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5383681_1',
      data: {
        cid: '5383681',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5383681_1',
      data: {
        cid: '5383681',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5385091_1',
      data: {
        cid: '5385091',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5386812_1',
      data: {
        cid: '5386812',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5387098_1',
      data: {
        cid: '5387098',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5387141_1',
      data: {
        cid: '5387141',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5387258_1',
      data: {
        cid: '5387258',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5388063_1',
      data: {
        cid: '5388063',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5388065_1',
      data: {
        cid: '5388065',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5388226_1',
      data: {
        cid: '5388226',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '5388403_1',
      data: {
        cid: '5388403',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '54610141_1',
      data: {
        cid: '54610141',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '54611756_1',
      data: {
        cid: '54611756',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '54611951_1',
      data: {
        cid: '54611951',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '54613334_1',
      data: {
        cid: '54613334',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '59453_1',
      data: {
        cid: '59453',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '59453_1',
      data: {
        cid: '59453',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
    {
      _id: '71833_1',
      data: {
        cid: '71833',
        aid: 1,
        assay:
          'NCI human tumor cell line growth inhibition assay. Data for the NCI-H23 Non-Small Cell Lung cell line',
      },
    },
  ]);
});
