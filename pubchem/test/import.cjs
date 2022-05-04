const { readFileSync } = require('fs');
const { join } = require('path');
const { gunzipSync } = require('zlib');

const { parse } = require('arraybuffer-xml-parser');

async function test() {
  let inflated = gunzipSync(
    readFileSync(join(__dirname, 'pubmed22n1171.xml.gz')),
  );

  const parsed = parse(inflated, {
    textNodeName: '_text',
    attributeNameProcessor: (name) => {
      if (name.match(/^[A-Z]+$/)) {
        return name.toLowerCase();
      } else if (name.match(/^[A-Z]/)) {
        return name.toLowerCase() + name.substring(1);
      }
      return name;
    },
  });

  let pubmeds = parsed.PubmedArticleSet.PubmedArticle;
  pubmeds = pubmeds.slice(0, 10);

  console.log(pubmeds);
}

test();
