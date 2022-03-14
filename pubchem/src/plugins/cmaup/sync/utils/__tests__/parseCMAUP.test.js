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
            refIdType: 'PMID',
            activityValue: undefined,
            refId: '3236014',
          },
        ],
        taxonomy: {
          organismIdNCBI: 'NA',
          organismName: 'boswellia spp.',
          tree: [[], [], [], 'Burseraceae', 'Boswellia', 'NA'],
        },
      },
    });
  });
});
