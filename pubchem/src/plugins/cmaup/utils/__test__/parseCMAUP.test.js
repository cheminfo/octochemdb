import { join } from 'path';

import { parseCMAUP } from '../parseCMAUP';

describe('parseCMAUP', () => {
  it('simple case', () => {
    const result = parseCMAUP(join(__dirname, 'data'));

    expect(result[0]).toStrictEqual({
      ocl: {
        id: 'ehRPL@@@D@\\bfbbTbRbJabQTRtfdLBrzFNnZjjjjejjjjjjDpQDXdbrWRFUt@@',
        coordinates:
          '!B?g~H?[_}?g~w@f]SFENw?Qh_wzZYpFT_mpHkn}KOJ{nw?Qh_wzZw@oy?J{lkn}~fwzYeXBn{J{o_ihPkf]|knp',
        noStereoID: 'ehRPL@@@D@\\bfbbTbRbJabQTRtfdLBrzFNnZjjjjejjjjjj@@@',
        pubChemCID: '158143',
      },
      origin: {
        activities: [
          {
            activityType: 'IC50',
            activityUnit: 'nM',
            activityValue: undefined,
            refIdType: 'PMID',
            refId: '3236014',
          },
        ],
        taxonomy: {
          Plant_ID: 'NPO33055',
          Plant_Name: 'boswellia spp.',
          Species_Tax_ID: 'NA',
          Species_Name: 'NA',
          Genus_Tax_ID: '80276',
          Genus_Name: 'Boswellia',
          Family_Tax_ID: '4014',
          Family_Name: 'Burseraceae',
        },
      },
    });
  });
});
