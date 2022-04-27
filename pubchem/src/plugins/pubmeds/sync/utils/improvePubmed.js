import camelcaseKeys from 'camelcase-keys';

export default function improvePubmed(pubmedCitation) {
  let result = {
    _id: Number(pubmedCitation.pmid.$text),
    _seq: 0,
    data: camelcaseKeys(pubmedCitation, { deep: true }),
  };

  return result;
}
