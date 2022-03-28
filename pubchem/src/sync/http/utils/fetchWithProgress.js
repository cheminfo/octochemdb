import fetch from 'cross-fetch';

export async function fetchWithProgress(url, options) {
  const { callback } = options;
  const response = await fetch(url);
  const reader = response.body.getReader();

  // Step 2: get total length
  const contentLength = +response.headers.get('Content-Length');

  // Step 3: read the data
  let receivedLength = 0; // received that many bytes at the moment
  let chunks = []; // array of received binary chunks (comprises the body)
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    if (callback) {
      callback(receivedLength, contentLength);
    }
  }

  let result = new Uint8Array(receivedLength); // (4.1)
  let position = 0;
  for (let chunk of chunks) {
    result.set(chunk, position); // (4.2)
    position += chunk.length;
  }
  return result;
}
