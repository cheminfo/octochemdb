import camelcaseKeys from 'camelcase-keys';

export default function improvePubmed(pubmedCitation) {
  let result = {
    _id: pubmedCitation.pmid,
    _seq: 0,
    data: camelcaseKeys(pubmedCitation, { deep: true }),
  };

  return result;
}
