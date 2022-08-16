import { open } from 'fs/promises';

import { parseStream } from 'arraybuffer-xml-parser';

const xmlPath = './data/2001.xml';
const fileStream = await open(xmlPath, 'r');
const readableStream = fileStream.readableWebStream();
let count = 0;
for await (const entry of parseStream(
  readableStream,
  'patent-application-publication',
)) {
  let results = await parseUsp(entry);
  count++;
  if (count > 10000000) {
    break;
  }
}

/*
    2001 version 1.5
    2002,2003,2004 version 1.6
    2005 XML Version 4.0 ICE
    2006 XML Version 4.1 ICE
    2007,2008,2009,2010,2011,2012 XML Version 4.2 ICE
    2013,2014 XML Version 4.3 ICE
    2015,2016,2017,2018,2019,2020,2021 XML Version 4.4 ICE
    2022 XML Version 4.5 or 4.6 ICE
    */
async function parseUsp(entry) {
  let usp = {};
  // Get document reference id
  const docRef = entry['subdoc-bibliographic-information']['document-id'];
  usp.id = `US-${docRef['doc-number']}-${docRef['kind-code']}`;
  usp.pubchemPatentId = `US${docRef['doc-number']}${docRef['kind-code']}`;
  usp.title =
    entry['subdoc-bibliographic-information']['technical-information'][
      'title-of-invention'
    ];
  usp.abstract = entry['subdoc-abstract'].paragraph['#text'];
  usp.applicationType =
    entry['subdoc-bibliographic-information']['publication-filing-type'];
  console.log(entry['subdoc-description']);

  let results = {};
  /*
  [
  'subdoc-bibliographic-information',
  'subdoc-abstract',
  'subdoc-description',
  'subdoc-claims'
]
 'document-id',
  'publication-filing-type',
  'domestic-filing-data',
  'foreign-priority-data',
  'technical-information',
  'continuity-data',
  'inventors',
  'correspondence-address'

   let results = {
    _id: usp.id,
    data: {},
  };
  if (usp.title) {
    results.data.title = usp.title;
  }
  if (usp.abstract) {
    results.data.abstract = usp.abstract;
  }
  if (usp.language) {
    results.data.language = usp.language;
  }
  if (usp.status) {
    results.data.status = usp.status;
  }
  if (usp.country) {
    results.data.country = usp.country;
  }
  if (usp.dateProduced) {
    results.data.dateProduced = usp.dateProduced;
  }
  if (usp.datePublished) {
    results.data.datePublished = usp.datePublished;
  }
  if (usp.applicationType) {
    results.data.applicationType = usp.applicationType;
  }
  if (usp.patentNumber) {
    results.data.patentNumber = usp.patentNumber;
  }
  if (usp.pubchemPatentId) {
    results.data.pubchemPatentId = usp.pubchemPatentId;
  }
  */
  return results;
}
