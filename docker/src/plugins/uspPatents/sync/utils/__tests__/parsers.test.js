import { open } from 'fs/promises';
import { join } from 'path';

import { parseStream } from 'arraybuffer-xml-parser';
import { describe, it, expect } from 'vitest';

import { parsers } from '../parsers/parsers.js';

describe('parsers', () => {
  it('2001', async () => {
    const xmlPath = join(__dirname, 'data/2001.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'patent-application-publication',
    )) {
      results = parsers(entry, 2001);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
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
      results = parsers(entry, 2002);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2003', async () => {
    const xmlPath = join(__dirname, 'data/2003.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'patent-application-publication',
    )) {
      results = parsers(entry, 2003);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2004', async () => {
    const xmlPath = join(__dirname, 'data/2004.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'patent-application-publication',
    )) {
      results = parsers(entry, 2004);
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
      results = parsers(entry, 2005);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });

  it('2007', async () => {
    const xmlPath = join(__dirname, 'data/2007.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2007);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2008', async () => {
    const xmlPath = join(__dirname, 'data/2008.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2008);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2009', async () => {
    const xmlPath = join(__dirname, 'data/2009.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2009);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2010', async () => {
    const xmlPath = join(__dirname, 'data/2010.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2010);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2011', async () => {
    const xmlPath = join(__dirname, 'data/2011.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2011);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2012', async () => {
    const xmlPath = join(__dirname, 'data/2012.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2012);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2013', async () => {
    const xmlPath = join(__dirname, 'data/2013.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2013);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });

  it('2014', async () => {
    const xmlPath = join(__dirname, 'data/2014.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2014);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2015', async () => {
    const xmlPath = join(__dirname, 'data/2015.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2015);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2016', async () => {
    const xmlPath = join(__dirname, 'data/2016.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2016);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2017', async () => {
    const xmlPath = join(__dirname, 'data/2017.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2017);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2018', async () => {
    const xmlPath = join(__dirname, 'data/2018.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2018);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2019', async () => {
    const xmlPath = join(__dirname, 'data/2019.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2019);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2020', async () => {
    const xmlPath = join(__dirname, 'data/2020.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2020);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2021', async () => {
    const xmlPath = join(__dirname, 'data/2021.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2021);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });

  it('2022a', async () => {
    const xmlPath = join(__dirname, 'data/2022a.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2022);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2022b', async () => {
    const xmlPath = join(__dirname, 'data/2022b.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2022);

      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
  it('2023', async () => {
    const xmlPath = join(__dirname, 'data/2023.xml');
    const fileStream = await open(xmlPath, 'r');
    const readableStream = fileStream.readableWebStream();
    let count = 0;
    let results;
    for await (const entry of parseStream(
      readableStream,
      'us-patent-application',
    )) {
      results = parsers(entry, 2023);
      count++;
      if (count > 0) {
        break;
      }
    }
    await fileStream.close();
    expect(results).toMatchSnapshot();
  });
});
