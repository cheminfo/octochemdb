import { join } from 'path';

import { parseNpasses } from '../parseNpasses';
import readNpassesLastFiles from '../readNpassesLastFiles';

test('simple case', async () => {
  const { general, activities, properties, speciesPair, speciesInfo } =
    readNpassesLastFiles(
      join(
        __dirname,
        'data',
        'NPASSv1.0_download_naturalProducts_generalInfo.txt',
      ),
      join(
        __dirname,
        'data',
        'NPASSv1.0_download_naturalProducts_activities.txt',
      ),
      join(
        __dirname,
        'data',
        'NPASSv1.0_download_naturalProducts_properties.txt',
      ),
      join(
        __dirname,
        'data',
        'NPASSv1.0_download_naturalProducts_speciesInfo.txt',
      ),
      join(
        __dirname,
        'data',
        'NPASSv1.0_download_naturalProducts_species_pair.txt',
      ),
    );
  let result = [];
  for await (const entry of parseNpasses(
    general,
    activities,
    properties,
    speciesInfo,
    speciesPair,
  )) {
    result.push(entry);
  }
  expect(result[5]).toStrictEqual({
    _id: 'NPC10005',
    data: {
      ocl: {
        id: 'e`rpD@@@DLbbRbTbReTRTJbRdJVTrbRtUQcfURqtNHjkUUUUUUUUUUUUUUUTtHPiHxheUAhBlX@@',
        noStereoID:
          'e`rpD@@@DLbbRbTbReTRTJbRdJVTrbRtUQcfURqtNHjkUUUUUUUUUUUUUUUTt@@@',
      },
      cid: '13915595',
      activities: [
        {
          activityType: 'MIC',
          activityValue: '100',
          activityUnit: 'ug/ml',
          targetId: '83332',
          assayOrganism: 'Mycobacterium tuberculosis H37Rv',
          refId: '10650093',
          refIdType: 'PMID',
        },
        {
          activityType: 'MIC',
          activityValue: '100',
          activityUnit: 'ug/ml',
          targetId: '83332',
          assayOrganism: 'Mycobacterium tuberculosis H37Rv',
          refId: '10650093',
          refIdType: 'PMID',
        },
      ],
    },
  });
});
