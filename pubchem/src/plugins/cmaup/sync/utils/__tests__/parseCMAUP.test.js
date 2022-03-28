import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'papaparse';

import { parseCMAUP } from '../parseCMAUP';

describe('parseCMAUP', () => {
  it('simple case', () => {
    const dirPath = join(__dirname, 'data');
    const general = parse(
      readFileSync(join(dirPath, 'Ingredients.txt'), 'utf8'),
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
      _id: 'NPC211625',
      data: {
        cid: '76319166',
        ocl: {
          id: 'fak@P@@H}dhRDRDaLaHcHRDaHDp_QkujZijjZjjbDPhYVTBH',
          coordinates:
            '!BMww~_{_|bOvw?_x@bOs~_?y?bOvfpHa}m?vw@hQT?g~@SdoxbGw~_?y?mpJw?P',
          noStereoID: 'fak@P@@H}dhRDRDaLaHcHRDaHDp_QkujZijjZjj`@@',
        },
        taxonomy: [
          {
            family: undefined,
            genus: undefined,
            species: undefined,
          },
        ],
        activities: [],
      },
    });
  });
});
