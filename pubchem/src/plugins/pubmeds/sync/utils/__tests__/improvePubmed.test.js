import { debug } from 'console';
import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'arraybuffer-xml-parser';

import improvePubmed from '../improvePubmed.js';

test('pubmeds', () => {
  const parsed = parse(readFileSync(join(__dirname, 'data.xml')), {
    textNodeName: '_text',
  });

  const results = [];
  for (let entry of parsed.PubmedArticleSet.PubmedArticle.slice(0, 10)) {
    if (!entry.PubmedCitation) {
      debug('No PubmedCitation', entry);
    }
    results.push(improvePubmed(entry.PubmedCitation));
  }
});
