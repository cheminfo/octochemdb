import { promises as FS } from 'fs';

export default async function calculateDiff(newFilename) {
  const timeStart = Date.now();
  const newFileHandle = await FS.open(newFilename);

  const newData = {
    productsIDs: {},
    residual: '',
    endOfFile: false,
  };

  while (!newData.endOfFile) {
    while (Object.keys(newData.productsIDs).length < 2 && !newData.endOfFile) {
      await appendLines(newFileHandle, newData);
    }
  }

  await newFileHandle.close();
  const timeEnd = Date.now();
  console.log(`Time: ${timeEnd - timeStart}`);
}

const decoder = new TextDecoder('utf8');
const BUFFER_SIZE = 2 ** 24;

export async function appendLines(fileHandler, data) {
  let chunk = new Int8Array(BUFFER_SIZE);
  let result = await fileHandler.read(chunk, 0, BUFFER_SIZE);
  if (result.bytesRead < BUFFER_SIZE) {
    chunk = chunk.subarray(0, result.bytesRead);
    data.endOfFile = true;
  }
  let newLines = decoder.decode(chunk).split('\n');
  newLines[0] = data.residual + newLines[0];
  for (let i = 0; i < newLines.length - 1; i++) {}

  data.residual = newLines[newLines.length - 1];
}

await calculateDiff(
  '/usr/local/docker/pubchem/originalData/patents/cidToPatents/cidToPatents.2022-07-14.sorted',
);
