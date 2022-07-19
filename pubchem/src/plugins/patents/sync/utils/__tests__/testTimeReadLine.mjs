import { createReadStream } from 'fs';
import createInterface from 'readline';

export async function testTimeReadLine() {
  const fileName =
    '../originalData/patents/cidToPatents/cidToPatents.2022-07-14.sorted';
  const timeStart = Date.now();
  const stream = createReadStream(fileName);
  const lines = createInterface({ input: stream });
  let counter = 0;
  for await (const line of lines) {
    counter++;
    if (counter % 100 === 0) {
      console.log(counter);
    }
  }
  const timeEnd = Date.now();
  console.log(`Time: ${timeEnd - timeStart}`);
}
await testTimeReadLine();
