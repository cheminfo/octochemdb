import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'papaparse';

import { parseNpass } from '../parseNpass';

test('simple case', () => {
  const dirPath = join(__dirname, 'data');
  const general = parse(
    readFileSync(
      join(dirPath, 'NPASSv1.0_download_naturalProducts_generalInfo.txt'),
      'utf8',
    ),
    {
      header: true,
    },
  ).data;

  const activities = {};
  parse(
    readFileSync(
      join(dirPath, 'NPASSv1.0_download_naturalProducts_activities.txt'),
      'utf8',
    ),
    {
      header: true,
    },
  ).data.forEach((entry) => {
    if (!activities[entry.np_id]) {
      activities[entry.np_id] = [];
    }
    activities[entry.np_id].push(entry);
  });
  const properties = {};
  parse(
    readFileSync(
      join(dirPath, 'NPASSv1.0_download_naturalProducts_properties.txt'),
      'utf8',
    ),
    {
      header: true,
    },
  ).data.forEach((entry) => (properties[entry.np_id] = entry));
  const speciesPair = {};
  parse(
    readFileSync(
      join(dirPath, 'NPASSv1.0_download_naturalProducts_species_pair.txt'),
      'utf8',
    ),
    {
      header: true,
    },
  ).data.forEach((entry) => (speciesPair[entry.np_id] = entry.org_id));
  const speciesInfo = {};
  parse(
    readFileSync(
      join(dirPath, 'NPASSv1.0_download_naturalProducts_speciesInfo.txt'),
      'utf8',
    ),
    {
      header: true,
    },
  ).data.forEach((entry) => (speciesInfo[entry.org_id] = entry));

  const result = parseNpass(
    general,
    activities,
    properties,
    speciesPair,
    speciesInfo,
  );
  expect(result[0]).toStrictEqual({
    _id: 'eMACD\\QIh@',
    ocl: {
      id: 'eMACD\\QIh@',
      coordinates: '!B@Fp@Dp',
      noStereoID: 'eMACD\\QIh@',
      pubChemCID: '3024',
    },
    origin: {
      activities: [
        {
          activityType: 'Potency',
          activityValue: '12680',
          activityUnit: 'nM',
          assayOrganism: '',
          refIdType: 'Dataset',
          refId: 'PubChem BioAssay data set',
        },
        {
          activityType: 'Potency',
          activityValue: '56639.3',
          activityUnit: 'nM',
          assayOrganism: '',
          refIdType: 'Dataset',
          refId: 'PubChem BioAssay data set',
        },
        {
          activityType: 'Potency',
          activityValue: '28.1',
          activityUnit: 'nM',
          assayOrganism: '',
          refIdType: 'Dataset',
          refId: 'PubChem BioAssay data set',
        },
      ],
      taxonomy: {
        organismName: 'Ainsliaea dissecta',
        organismIdNCBI: '130235',
        tree: ['Viridiplantae', '', '', 'Asteraceae', 'Ainsliaea'],
      },
    },
  });
});
