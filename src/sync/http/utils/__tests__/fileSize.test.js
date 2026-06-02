import http from 'node:http';
import { promisify } from 'node:util';

import { afterAll, beforeAll, expect, test } from 'vitest';

import { fileSize } from '../syncFolder.js';

const PAYLOAD = 'hello-world-payload';
let server;
let baseUrl;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/with-size') {
      res.setHeader('content-length', String(PAYLOAD.length));
      res.end(PAYLOAD);
    } else if (req.url === '/no-size') {
      // Force chunked transfer so no content-length header is emitted
      // (this mirrors the PubChem failure we saw on the server).
      res.setHeader('Transfer-Encoding', 'chunked');
      res.write(PAYLOAD);
      res.end();
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await promisify(server.listen.bind(server))(0, '127.0.0.1');
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await promisify(server.close.bind(server))();
});

test('fileSize returns the byte length when content-length is present', async () => {
  const result = await fileSize({ url: `${baseUrl}/with-size` });

  expect(result).toBe(PAYLOAD.length);
});

test('fileSize returns NaN when the server does not expose content-length', async () => {
  // Regression test for the syncCompoundFolder crash:
  // "Cannot read properties of undefined (reading '1')". The old code
  // dereferenced [1] on a missing header lookup and threw, which then
  // propagated up and caused importCompoundFiles to fail with
  // "Cannot read properties of undefined (reading 'Symbol(Symbol.asyncIterator)')".
  // The defensive fix must return NaN so callers can decide whether to
  // treat the local file as up-to-date.
  const result = await fileSize({ url: `${baseUrl}/no-size` });

  expect(Number.isNaN(result)).toBe(true);
});
