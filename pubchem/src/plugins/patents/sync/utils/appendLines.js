import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('appendLines');

const decoder = new TextDecoder('utf8');
const BUFFER_SIZE = 2 ** 24;

export default async function appendLines(fileHandler, data) {
  let chunk = new Int8Array(BUFFER_SIZE);
  let result = await fileHandler.read(chunk, 0, BUFFER_SIZE);
  if (result.bytesRead < BUFFER_SIZE) {
    chunk = chunk.subarray(0, result.bytesRead);
    data.endOfFile = true;
  }
  let newLines = decoder.decode(chunk).split('\n');
  newLines[0] = data.residual + newLines[0];
  for (let i = 0; i < newLines.length - 1; i++) {
    let fields = newLines[i].split('\t');
    if (fields.length !== 2) {
      debug(`Error fields: ${fields}`);
      continue;
    }
    const [productID, patentID] = fields;
    if (!data.productsIDs[productID]) {
      data.productsIDs[productID] = [];
    }
    data.productsIDs[productID].push(patentID);
  }

  data.residual = newLines[newLines.length - 1];
}
