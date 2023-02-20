import { open } from 'fs/promises';
import { join } from 'path';

import { parseStream } from 'arraybuffer-xml-parser';

import { parsers } from '../parsers/parsers.js';

describe('parsers', () => {
  it('2002', async () => {
    const xmlPath = join(__dirname, 'data/2002.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'patent-application-publication',
    )) {
      results = parsers(entry, '2002');
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2005', async () => {
    const xmlPath = join(__dirname, 'data/2005.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, '2005');
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2006', async () => {
    const xmlPath = join(__dirname, 'data/2006.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'patent-application-publication',
    )) {
      results = parsers(entry, '2006');
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
});
