/*
    2001 version 1.5 tag:'patent-application-publication'
    2002,2003,2004 version 1.6
    2005 XML Version 4.0 ICE
    2006 XML Version 4.1 ICE
    2007,2008,2009,2010,2011,2012 XML Version 4.2 ICE
    2013,2014 XML Version 4.3 ICE
    2015,2016,2017,2018,2019,2020,2021 XML Version 4.4 ICE
    2022 XML Version 4.5 or 4.6 ICE
    */
export function parse06(entry) {
  let usp = {};
  const documentReference = entry['subdoc-bibliographic-information'];
  usp.id = `US${documentReference['document-id']['doc-number']}${documentReference['document-id']['kind-code']}`;
  usp.title = documentReference['technical-information']['title-of-invention'];
  usp.abstract = entry['subdoc-abstract'].paragraph['#text'];
  usp.dateProduced = documentReference['domestic-filing-data']['filing-date'];
  usp.datePublished = documentReference['document-id']['document-date'];
  usp.patentNumber = documentReference['document-id']['doc-number'];
  // define final result
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

  if (usp.dateProduced) {
    results.data.dateProduced = usp.dateProduced;
  }
  if (usp.datePublished) {
    results.data.datePublished = usp.datePublished;
  }

  if (usp.patentNumber) {
    results.data.patentNumber = usp.patentNumber;
  }

  return results;
}
