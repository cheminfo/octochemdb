import {
  createWriteStream,
  existsSync,
  renameSync,
  rmSync,
  utimesSync,
} from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';

import delay from 'delay';
import { fileCollectionFromPath } from 'filelist-utils';
import pkg from 'fs-extra';
import fetch from 'node-fetch'; //ATTENTION: node-fetch is not the same as fetch

import debugLibrary from '../../../utils/Debug.js';

const { mkdirpSync } = pkg;
const debug = debugLibrary('getFileIfNew');

// The PubChem FTP server answers rapid sequential automated requests with a
// 503 (throttling) even though the file exists, and the throttle window can
// last a while. A single failed fetch must not abort the whole import, so we
// retry with exponential backoff (capped) until the server lets us through.
const MAX_FETCH_ATTEMPTS = 8;
const RETRY_BASE_DELAY = 10000; // ms; first backoff, doubled each attempt
const RETRY_MAX_DELAY = 120000; // ms; cap on a single backoff wait
const REQUEST_TIMEOUT = 1800 * 1000; // ms; per-attempt abort (30 minutes)
// Minimum gap between outgoing requests. Spacing requests out keeps us under
// the PubChem server's rate limit so we provoke far fewer 503s in the
// first place, rather than only reacting to them with retries.
const MIN_REQUEST_GAP = 500; // ms

let lastRequestAt = 0;

/**
 * Resolve once at least MIN_REQUEST_GAP has elapsed since the previous
 * reserved slot, throttling the global outgoing request rate. The next slot is
 * reserved synchronously before awaiting so concurrent callers queue in order
 * instead of racing on a stale timestamp.
 */
async function throttle() {
  const now = Date.now();
  const slot = Math.max(now, lastRequestAt + MIN_REQUEST_GAP);
  lastRequestAt = slot;
  const wait = slot - now;
  if (wait > 0) await delay(wait);
}

/**
 * Fetch a URL, retrying on network errors or non-200 responses with
 * exponential backoff (honouring a Retry-After header when present), so a
 * transient throttle on one file does not crash the whole sync. A fresh
 * AbortController is created per attempt so a stuck connection cannot block
 * the retry loop forever.
 * @param url - URL to fetch.
 * @param [method] - HTTP method ('HEAD' to read headers only, 'GET' to
 *   download the body).
 * @returns A successful (status 200) fetch Response.
 */
async function fetchWithRetry(url, method = 'GET') {
  let lastError;
  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt++) {
    // Exponential backoff: 10s, 20s, 40s, ... capped at RETRY_MAX_DELAY.
    let waitTime = Math.min(
      RETRY_BASE_DELAY * 2 ** (attempt - 1),
      RETRY_MAX_DELAY,
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      await throttle();
      const response = await fetch(url, { method, signal: controller.signal });
      if (response.status === 200) return response;
      // Drain the body of a non-200 so the socket can be reused.
      response.body?.resume?.();
      lastError = new Error(
        `Could not fetch file: ${url} (status ${response.status})`,
      );
      // The PubChem server throttles with 503 + a Retry-After header telling
      // us how long to back off; honour it so we stop hammering the server.
      const retryAfter = Number(response.headers.get('retry-after'));
      if (Number.isFinite(retryAfter) && retryAfter > 0) {
        waitTime = retryAfter * 1000;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timer);
    }
    if (attempt < MAX_FETCH_ATTEMPTS) {
      debug.warn(
        `Fetch attempt ${attempt}/${MAX_FETCH_ATTEMPTS} failed for ${url}: ${lastError.message}. Retrying in ${waitTime}ms`,
      );
      await delay(waitTime);
    }
  }
  throw lastError;
}

/**
 * We will extract the date of last modification of the file and only copy if new.
 * We will also append the date in the filename
 * @param file
 * @param targetFolder
 * @param options
 */
async function getFileIfNew(file, targetFolder, options = {}) {
  const { filename, extension } = options;

  if (!filename || !extension) {
    throw new Error('options filename and extension are mandatory');
  }
  let target;

  try {
    if (process.env.NODE_ENV !== 'test') {
      mkdirpSync(targetFolder);
    }

    // Inspect the local copy first so we can skip the network entirely when
    // nothing changed. Scan the destination folder a single time.
    const fileList = (
      await fileCollectionFromPath(targetFolder, {
        ungzip: { gzipExtensions: [] },
        unzip: { zipExtensions: [] },
      })
    ).files.filter(
      (localFile) =>
        (localFile.name.includes('.zip') ||
          localFile.name.includes('.txt') ||
          localFile.name.includes('.json') ||
          localFile.name.includes('.gz') ||
          localFile.name.includes('.msp') ||
          localFile.name.includes('.tsv.gz')) &&
        localFile.name.includes(filename) &&
        !localFile.relativePath.includes('old'),
    );
    let lastFilesSize = 0;
    let lastFileTargetLocal;
    for (const localFile of fileList) {
      if (lastFileTargetLocal === undefined || localFile.size < lastFilesSize) {
        lastFilesSize = localFile.size;
        lastFileTargetLocal = localFile.name;
      }
    }

    // Read the remote metadata with a cheap HEAD request (no body) instead of
    // opening a full GET against a multi-hundred-MB file just to read its
    // size. This is what kept triggering the server's 503 throttling.
    const headResponse = await fetchWithRetry(file.url, 'HEAD');
    const lastModified =
      headResponse.headers.get('last-modified') ||
      headResponse.headers.get('date');
    const contentLength = headResponse.headers.get('content-length');
    const newFileSize = contentLength ? Number(contentLength) : -1;
    debug.trace(
      `${filename}: remote size ${newFileSize} / local ${lastFilesSize}`,
    );

    if (lastFilesSize === newFileSize) {
      // Local copy is up to date — no download needed.
      debug.trace(`${filename}: up to date (${newFileSize}), no download`);
      return join(targetFolder, lastFileTargetLocal);
    }

    const modificationDate = new Date(lastModified).toISOString().slice(0, 10);
    debug.trace(`${filename}: changed, last modification ${modificationDate}`);
    // in case of test we do not want to write to disk
    if (process.env.NODE_ENV === 'test') {
      return `${filename}.${modificationDate}.${extension}`;
    }

    // Archive any previous local copies before downloading the new one.
    if (!existsSync(join(targetFolder, 'old', modificationDate))) {
      mkdirpSync(join(targetFolder, 'old', modificationDate));
    }
    for (const localFile of fileList) {
      renameSync(
        join(targetFolder, localFile.name),
        join(targetFolder, 'old', modificationDate, localFile.name),
      );
    }

    const targetFile = join(
      targetFolder,
      `${filename}.${modificationDate}.${extension}`,
    );
    target = targetFile;
    debug.trace(`${filename}: downloading to ${targetFile}`);

    // Only now do the heavy GET to stream the body to disk.
    const response = await fetchWithRetry(file.url, 'GET');
    await pipeline(response.body, createWriteStream(targetFile));
    if (file.epoch) utimesSync(targetFile, file.epoch, file.epoch);

    debug.trace(`${filename}: downloaded`);
    return targetFile;
  } catch (error) {
    debug.fatal(`ERROR downloading: ${filename}`);
    debug.fatal(error);
    if (existsSync(target)) {
      rmSync(target, { recursive: true });
    }
    throw error;
  }
}

export default getFileIfNew;
