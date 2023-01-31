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
export function parseUsp2001To2004(entry) {
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
  usp.dateProduced =
    entry['subdoc-bibliographic-information']['domestic-filing-data'][
      'filing-date'
    ];
  usp.datePublished =
    entry['subdoc-bibliographic-information']['document-id']['document-date'];

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
  if (usp.applicationType) {
    results.data.applicationType = usp.applicationType;
  }
  if (usp.patentNumber) {
    results.data.patentNumber = usp.patentNumber;
  }
  if (usp.pubchemPatentId) {
    results.data.pubchemPatentId = usp.pubchemPatentId;
  }

  return results;
}
