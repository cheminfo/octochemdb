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
export function parseUsp2005(entry) {
  let usp = {};
  const documentReference =
    entry['us-bibliographic-data-application']['publication-reference'];
  usp.id = `${documentReference['document-id'].country}-${documentReference['document-id']['doc-number']}-${documentReference['document-id'].kind}`;
  usp.pubchemPatentId = `${documentReference['document-id'].country}${documentReference['document-id']['doc-number']}${documentReference['document-id'].kind}`;
  usp.title =
    entry['us-bibliographic-data-application']['invention-title']['#text'];
  usp.abstract = entry.abstract.p['#text'];
  usp.applicationType =
    entry['us-bibliographic-data-application']['application-reference'][
      '$appl-type'
    ];
  usp.dateProduced = entry['$date-produced'];
  usp.datePublished = entry['$date-publ'];
  usp.country = entry.$country;
  usp.status = entry.$status;
  usp.language = entry.$lang;
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
  if (usp.status) {
    results.data.status = usp.status;
  }

  if (usp.country) {
    results.data.country = usp.country;
  }
  if (usp.language) {
    results.data.language = usp.language;
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
