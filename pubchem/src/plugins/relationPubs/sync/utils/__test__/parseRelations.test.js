import { parseRelations } from '../parseRelations.js';
import { join } from 'path';
// patent identifier
jest.setTimeout(500000000);
test('parseRelations', async () => {
  const pmidTocid = join(__dirname, 'data/cidTopmidTest.txt');
  const cidTopatent = join(__dirname, 'data/cidTopatentTest.txt');
  const cidTosid = join(__dirname, 'data/cidTosidTest.txt');

  let results = [];
  for await (const entry of parseRelations(pmidTocid, cidTosid, cidTopatent)) {
    results.push(entry);
  }

  console.log(results[0]);
});
