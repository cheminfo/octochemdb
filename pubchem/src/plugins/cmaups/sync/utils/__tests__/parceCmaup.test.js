import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'papaparse';

import { parseCmaups } from '../parseCmaups';

test('parseCmaups', () => {
  const dirPath = join(__dirname, 'data');
  const general = parse(
    readFileSync(join(dirPath, 'Ingredients.2020-07-10.txt'), 'utf8'),
    {
      header: true,
    },
  ).data;
  const activities = {};

  parse(readFileSync(join(dirPath, 'Activity.2020-07-10.txt'), 'utf8'), {
    header: true,
  }).data.forEach((entry) => {
    if (!activities[entry.Ingredient_ID]) {
      activities[entry.Ingredient_ID] = [];
    }
    activities[entry.Ingredient_ID].push(entry);
  });
  const speciesPair = parse(
    readFileSync(join(dirPath, 'speciesAssociation.2020-07-10.txt'), 'utf8'),
    {
      header: false,
    },
  ).data;
  const speciesInfo = {};
  parse(readFileSync(join(dirPath, 'speciesInfo.2020-07-10.txt'), 'utf8'), {
    header: true,
  }).data.forEach((entry) => (speciesInfo[entry.Plant_ID] = entry));
  const result = parseCmaups(general, activities, speciesPair, speciesInfo);
  expect(result[13]).toStrictEqual({
    _id: 'NPC146355',
    data: {
      ocl: {
        id: 'fa{@p@@F\\fo\\dTRbRRRafRtIJRMkqVuTEATAAEPDaBRbe@@',
        coordinates:
          '!Bs|uTn{\\BSk}}m{_}?`A}mtz?m?rw@eR{bGvw?_x@?g~H?K\\BbGvH__y?b@JH_P',
        noStereoID: 'fa{@p@@F\\fo\\dTRbRRRafRtIJRMkqVuTEATAAEP@@@',
      },
      cid: '24992964',
      taxonomies: [
        {
          family: 'Rubiaceae',
          genus: 'Morinda',
          species: 'Morinda citrifolia',
        },
      ],
      activities: [
        {
          activityType: 'IC50',
          activityValue: '5900',
          activityUnit: 'nM',
          refIdType: 'PMID',
          refId: '16413779',
        },
      ],
    },
  });
});
