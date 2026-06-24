import {
  createWriteStream,
  existsSync,
  renameSync,
  rmSync,
  utimesSync,
} from 'node:fs';
import { join } from 'node:path';

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

/**
 * Fetch a URL, retrying on network errors or non-200 responses. Mirrors the
 * retry behaviour already used when listing remote directories so that a
 * transient failure on one file does not crash the sync.
 * @param url - URL to fetch.
 * @param init - fetch() options (e.g. the abort signal).
 * @returns A successful (status 200) fetch Response.
 */
async function fetchWithRetry(url, init) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt++) {
    // Exponential backoff: 10s, 20s, 40s, ... capped at RETRY_MAX_DELAY.
    let waitTime = Math.min(
      RETRY_BASE_DELAY * 2 ** (attempt - 1),
      RETRY_MAX_DELAY,
    );
    try {
      const response = await fetch(url, init);
      if (response.status === 200) return response;
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
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1800 * 1000); // 30 minutes
    const response = await fetchWithRetry(file.url, {
      signal: controller.signal,
    });
    const headers = Array.from(response.headers);
    let lastMofidied =
      headers.find((row) => row[0] === 'last-modified') ||
      headers.find((row) => row[0] === 'date');

    let contentLength = headers.find((row) => {
      return row[0]?.toLocaleLowerCase() === 'content-length';
    });

    debug.trace(`${filename}: New file size: ${contentLength}`);
    let newFileSize = contentLength ? Number(contentLength[1]) : -1;
    let fileList = (
      await fileCollectionFromPath(targetFolder, {
        ungzip: { gzipExtensions: [] },
        unzip: { zipExtensions: [] },
      })
    ).files.filter(
      (file) =>
        (file.name.includes('.zip') ||
          file.name.includes('.txt') ||
          file.name.includes('.json') ||
          file.name.includes('.gz') ||
          file.name.includes('.msp') ||
          file.name.includes('.tsv.gz')) &&
        file.name.includes(filename) &&
        !file.relativePath.includes('old'),
    );
    let lastFilesSize;
    let lastFileTargetLocal;
    if (fileList.length > 0) {
      lastFilesSize = fileList.sort((a, b) => a.size - b.size)[0].size;
      lastFileTargetLocal = fileList.find(
        (file) => file.size === lastFilesSize,
      ).name;
    } else {
      lastFilesSize = 0;
    }

    if (lastFilesSize !== newFileSize) {
      let modificationDate = new Date(lastMofidied[1])
        .toISOString()
        .slice(0, 10);
      debug.trace(`Last modification date: ${modificationDate}`);
      // in case of test we do not want to write to disk
      if (process.env.NODE_ENV === 'test') {
        return `${filename}.${modificationDate}.${extension}`;
      }
      if (
        !existsSync(join(targetFolder, 'old', modificationDate)) &&
        process.env.NODE_ENV !== 'test'
      ) {
        mkdirpSync(join(targetFolder, 'old', modificationDate));
      }
      for (const file of fileList) {
        renameSync(
          join(targetFolder, file.name),
          join(targetFolder, 'old', `${modificationDate}`, file.name),
        );
      }

      const targetFile = join(
        targetFolder,
        `${filename}.${modificationDate}.${extension}`,
      );
      target = targetFile;
      debug.trace(`targetFile: ${targetFile}`);

      debug.trace(
        `New file size do not match local one:${newFileSize}/${lastFilesSize}`,
      );
      const body = response.body;
      const encoding = body._readableState.defaultEncoding;

      const writeStream = createWriteStream(targetFile, encoding);
      for await (let part of body) {
        writeStream.write(part);
      }
      writeStream.close();
      if (file.epoch) utimesSync(targetFile, file.epoch, file.epoch);

      debug.trace(`Downloaded: ${options.filename}`);

      return targetFile;
    } else {
      const targetFile = join(targetFolder, lastFileTargetLocal);
      debug.trace(
        `${filename}: New file size match local one (no need to fetch):${
          newFileSize === 0 ? 'undefined' : newFileSize
        }/${lastFilesSize}`,
      );
      return targetFile;
    }
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
