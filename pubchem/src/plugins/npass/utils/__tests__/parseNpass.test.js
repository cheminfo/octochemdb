import { join } from 'path';

import { parseNpass } from '../parseNpass';

describe('parseNpass', () => {
  it('simple case', () => {
    const result = parseNpass(join(__dirname, 'data'));
    expect(result[0]).toStrictEqual({
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
});
