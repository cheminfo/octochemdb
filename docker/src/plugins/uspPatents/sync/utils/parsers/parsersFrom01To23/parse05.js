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
export function parse05(entry) {
  let usp = {};
  const documentReference =
    entry['us-bibliographic-data-application']['publication-reference'];
  usp.id = `${documentReference['document-id'].country}${documentReference['document-id']['doc-number']}${documentReference['document-id'].kind}`;
  usp.title =
    entry['us-bibliographic-data-application']['invention-title']['#text'];
  usp.abstract = entry.abstract.p['#text'];
  usp.patentNumber = documentReference['document-id']['doc-number'];

  usp.dateProduced = entry['$date-produced'];
  usp.datePublished = entry['$date-publ'];
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
