import { readFileSync } from 'fs';
import { join } from 'path';

import { parseLotus } from '../parseLotus.js';

test('parseLotus', () => {
  const json = readFileSync(join(__dirname, 'data/lotus.json'), 'utf8');
  const results = parseLotus(JSON.parse(json));
  expect(results[0]).toStrictEqual({
    _id: 'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
    ocl: {
      id: 'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjkrBHPaTKaRSrUPZSKZWHEXqe@@',
      coordinates:
        '!BM`?d[NlSJNThyTepU~hvC~QlyFsd[NlSRW@hyU_j[NoeU||FIrupZDepb?SYT@}v_qzGFdUHQTcwyfHxlMGQlC\\zLuQGXd\\]?kAGXozpQquGXd]bQqw~l@',
      noStereoID:
        'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
    },
    origin: {
      taxonomy: {
        organismIdNCBI: '3673',
        organismName: 'Momordica charantia',
        tree: [
          'Viridiplantae',
          'Streptophyta',
          'Magnoliopsida',
          'Cucurbitaceae',
          'Momordica',
          'Momordica charantia',
        ],
      },
    },
  });
});
