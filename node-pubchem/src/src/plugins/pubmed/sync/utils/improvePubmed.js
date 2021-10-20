export default function improvePubmed(pubmedCitation) {
  let result = {
    _id: pubmedCitation.PMID._text,
    _seq: 0,
    data: pubmedCitation,
  };

  let subresult = result.data;
  for (let key in subresult) {
    if (key.match(/^[A-Z]+$/)) {
      subresult[key.toLowerCase()] = subresult[key];
      delete subresult[key];
    } else if (key.match(/^[A-Z]/)) {
      subresult[key[0].toLowerCase() + key.substring(1)] = subresult[key];
      delete subresult[key];
    }
  }

  return result;
}
