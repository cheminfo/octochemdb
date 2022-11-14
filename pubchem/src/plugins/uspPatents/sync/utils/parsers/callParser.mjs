import { open } from 'fs/promises';

import { parseStream } from 'arraybuffer-xml-parser';

import { parseUsp2006 } from './parseUsp2006.js';

async function doAll() {
  const xmlPath = '../__tests__/data/2006.xml';
  const fileStream = await open(xmlPath, 'r');
  const readableStream = fileStream.readableWebStream();
  let count = 0;
  let results;
  for await (const entry of parseStream(
    readableStream,
    'patent-application-publication',
  )) {
    results = parseUsp2006(entry);
    count++;
    if (count > 0) {
      break;
    }
  }
}

doAll();
