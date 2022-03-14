import { join } from 'path';

import { convertNpass } from '../convertNpass';

describe('convertNpass', () => {
  it('simple case', () => {
    const result = convertNpass(join(__dirname, 'data'));
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
          // id of UniProt
          organismName: 'Ainsliaea dissecta',
          genusName: 'Ainsliaea',
          genusID: '41469',
          familyName: 'Asteraceae',
          familyID: '4210',
          kingdomName: 'Viridiplantae',
          kingdomID: '33090',
          superKingdomName: 'Eukaryota',
          superKindomID: '2759',
        },
      },
    });
  });
});
