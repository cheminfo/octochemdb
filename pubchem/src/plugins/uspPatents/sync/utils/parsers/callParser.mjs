import { open } from 'fs/promises';

import { parseStream } from 'arraybuffer-xml-parser';

import { parseUsp2005 } from './parseUsp2005.js';

async function doAll() {
  const xmlPath = '../__tests__/data/2005.xml';
  const fileStream = await open(xmlPath, 'r');
  const readableStream = fileStream.readableWebStream();
  let count = 0;
  let results;
  for await (const entry of parseStream(
    readableStream,
    'us-patent-application',
  )) {
    results = parseUsp2005(entry);
    count++;
    if (count > 0) {
      break;
    }
  }
}

doAll();
