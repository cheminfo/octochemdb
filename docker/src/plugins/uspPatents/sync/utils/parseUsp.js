export async function parseUsp(entry) {
  let usp = {};
  usp.abstract = entry.abstract.p['#text'];
  usp.language = entry.$lang;
  usp.status = entry.$status;
  usp.country = entry.$country;
  usp.dateProduced = entry['$date-produced'];
  usp.datePublished = entry['$date-publ'];

  usp.applicationType =
    entry['us-bibliographic-data-application']['application-reference'][
      '$appl-type'
    ];
  usp.title =
    entry['us-bibliographic-data-application']['invention-title']['#text'];
  const docRef =
    entry['us-bibliographic-data-application']['publication-reference'][
      'document-id'
    ];
  if (
    docRef.country !== undefined &&
    docRef['doc-number'] !== undefined &&
    docRef.kind !== undefined
  ) {
    usp.id = `${docRef.country}-${docRef['doc-number']}-${docRef.kind}`;
    usp.pubchemPatentId = `${docRef.country}${docRef['doc-number']}${docRef.kind}`;
  } else {
    usp.id = `${docRef.country}-${docRef['doc-number']}`;
    usp.pubchemPatentId = `${docRef.country}${docRef['doc-number']}`;
  }
  usp.patentNumber = docRef['doc-number'];
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
  return results;
}
