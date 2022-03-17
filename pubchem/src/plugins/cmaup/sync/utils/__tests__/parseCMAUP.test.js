import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'papaparse';

import { parseCMAUP } from '../parseCMAUP';

describe('parseCMAUP', () => {
  it('simple case', () => {
    const dirPath = join(__dirname, 'data');
    const general = parse(
      readFileSync(
        join(dirPath, 'CMAUPv1.0_download_Ingredients_onlyActive.txt'),
        'utf8',
      ),
      {
        header: true,
      },
    ).data;
    const activities = {};

    parse(
      readFileSync(
        join(
          dirPath,
          'CMAUPv1.0_download_Ingredient_Target_Associations_ActivityValues_References.txt',
        ),
        'utf8',
      ),
      {
        header: true,
      },
    ).data.forEach((entry) => {
      if (!activities[entry.Ingredient_ID]) {
        activities[entry.Ingredient_ID] = [];
      }
      activities[entry.Ingredient_ID].push(entry);
    });
    const speciesPair = parse(
      readFileSync(
        join(
          dirPath,
          'CMAUPv1.0_download_Plant_Ingredient_Associations_onlyActiveIngredients.txt',
        ),
        'utf8',
      ),
      {
        header: false,
      },
    ).data;
    const speciesInfo = {};
    parse(
      readFileSync(join(dirPath, 'CMAUPv1.0_download_Plants.txt'), 'utf8'),
      {
        header: true,
      },
    ).data.forEach((entry) => (speciesInfo[entry.Plant_ID] = entry));
    const result = parseCMAUP(general, activities, speciesPair, speciesInfo);

    expect(result[0]).toStrictEqual({
      _id: 'ehRPL@@@D@\\bfbbTbRbJabQTRtfdLBrzFNnZjjjjejjjjjj@@@',
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
