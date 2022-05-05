import { createReadStream } from 'fs';
import { join } from 'path';
import { createGunzip } from 'zlib';

import pkg, { toXml } from 'xml-flow';
import { toJson } from 'xml2json';

import improvePubmed from '../improvePubmed.js';

const flow = pkg;
test('pubmeds', async () => {
  const stream = createReadStream(join(__dirname, 'pubmedTest.gz')).pipe(
    createGunzip(),
  );

  const xmlStream = flow(stream);
  const results = [];
  let counter = 0;
  await new Promise((resolve, reject) => {
    xmlStream
      .on('tag:pubmedarticle', async (article) => {
        let recovertToXml = toXml(article);
        let pubMedObject = toJson(recovertToXml, {
          object: true,
          alternateTextNode: true,
        }).pubmedarticle.medlinecitation;
        let result = improvePubmed(pubMedObject);
        results.push(result);
        counter++;
        if (counter > 0) resolve();
      })
      .on('end', async () => {
        resolve();
      });
  });
  expect(results).toMatchSnapshot();
});
