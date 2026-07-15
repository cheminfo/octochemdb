import {
  createWriteStream,
  existsSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
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

// Name of the sub-folder that holds archived (previous) versions of the data.
const PREVIOUS_FOLDER = 'previous';
// How many previous versions to keep. A single version may consist of several
// files, all grouped under one dated sub-folder, so retention is counted by
// dated sub-folder (i.e. by version) rather than by individual file. Plugins
// that update incrementally never reach this code path (they use syncFolder
// instead of getFileIfNew), so their full historical set is always preserved.
const MAX_PREVIOUS_VERSIONS = 3;

/**
 * Keep only the most recent {@link MAX_PREVIOUS_VERSIONS} archived versions in
 * `<targetFolder>/<PREVIOUS_FOLDER>`, deleting older ones. Each version is a
 * dated sub-folder (named after the file's modification date) that may contain
 * one or more files, so pruning is done per sub-folder, not per file.
 * @param targetFolder - Folder whose `previous` sub-folder is pruned.
 */
function prunePreviousVersions(targetFolder) {
  const previousFolder = join(targetFolder, PREVIOUS_FOLDER);
  if (!existsSync(previousFolder)) return;
  const versions = readdirSync(previousFolder)
    .filter((name) => statSync(join(previousFolder, name)).isDirectory())
    // Dated folder names (YYYY-MM-DD) sort chronologically as strings.
    .toSorted();
  const toRemove = versions.slice(0, -MAX_PREVIOUS_VERSIONS);
  for (const version of toRemove) {
    debug.trace(`Pruning old version: ${join(previousFolder, version)}`);
    rmSync(join(previousFolder, version), { recursive: true, force: true });
  }
}

// The PubChem FTP server answers rapid sequential automated requests with a
// 503 (throttling) even though the file exists, and the throttle window can
// last a while. A single failed fetch must not abort the whole import, so we
// retry with exponential backoff (capped) until the server lets us through.
const MAX_FETCH_ATTEMPTS = 8;
// A 200 response whose body ends early (the server closed the connection before
// sending the whole file) is NOT a fetch error — stream.pipeline() accepts it —
// so fetchWithRetry cannot catch it. We re-download the whole file until its
// size matches the server's advertised size, up to this many times.
const MAX_DOWNLOAD_ATTEMPTS = 5;
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
      // For the HEAD size-check, ask for an uncompressed response. Some servers
      // (e.g. bidd.group / NPASS) gzip the body when the client accepts gzip,
      // and a gzipped response carries no Content-Length — which made the size
      // check read -1 and re-download the file on every run. Requesting
      // `identity` encoding forces the server to report the real Content-Length.
      const headers =
        method === 'HEAD' ? { 'Accept-Encoding': 'identity' } : undefined;
      const response = await fetch(url, {
        method,
        headers,
        signal: controller.signal,
      });
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
        // Ignore leftover partial downloads from an interrupted run.
        !localFile.name.endsWith('.download') &&
        !localFile.relativePath.includes(PREVIOUS_FOLDER),
    );
    let lastFilesSize = 0;
    let lastFileTargetLocal;
    for (const localFile of fileList) {
      // Pick the LARGEST local copy: it is the one most likely to be complete.
      // Selecting the smallest would prefer a truncated/partial download and,
      // because that size feeds the up-to-date short-circuit below, re-serve
      // the corrupt file on every run without ever re-downloading it.
      if (lastFileTargetLocal === undefined || localFile.size > lastFilesSize) {
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

    if (newFileSize !== -1 && lastFilesSize === newFileSize) {
      // Local copy is up to date (matched by size) — no download needed.
      debug.trace(`${filename}: up to date (${newFileSize}), no download`);
      return join(targetFolder, lastFileTargetLocal);
    }

    const modificationDate = new Date(lastModified).toISOString().slice(0, 10);

    // Some servers (e.g. bidd.group / NPASS) do not send a content-length, so
    // the size check above can never match and every run would re-download the
    // full file. Fall back to the last-modified date: the local file is named
    // `<filename>.<YYYY-MM-DD>.<ext>`, so if a local copy already carries the
    // remote's modification date, it is up to date and we can skip the download.
    if (
      newFileSize === -1 &&
      lastFileTargetLocal &&
      lastFileTargetLocal.includes(modificationDate)
    ) {
      debug.trace(
        `${filename}: up to date (last-modified ${modificationDate}), no download`,
      );
      return join(targetFolder, lastFileTargetLocal);
    }

    debug.trace(`${filename}: changed, last modification ${modificationDate}`);
    // in case of test we do not want to write to disk
    if (process.env.NODE_ENV === 'test') {
      return `${filename}.${modificationDate}.${extension}`;
    }

    const targetFile = join(
      targetFolder,
      `${filename}.${modificationDate}.${extension}`,
    );

    // Download to a temporary path FIRST, and only archive the old copy once
    // the download has fully succeeded. This keeps the operation atomic: if the
    // remote fetch fails (bidd.group and the PubChem FTP are both flaky, and a
    // missing content-length makes every run look "changed"), the existing good
    // local copy is left untouched instead of being moved into the previous/
    // folder and then lost when the download never completes.
    const downloadTmp = `${targetFile}.download`;
    target = downloadTmp;

    // Download until the file on disk is COMPLETE, retrying in-run. A streamed
    // download can fail two server-agnostic ways, and this loop covers both:
    //   1. The connection errors or drops mid-body — stream.pipeline() rejects,
    //      so we catch, delete the partial, back off and retry. Needs no
    //      Content-Length, so it protects downloads from any server.
    //   2. The server answers 200 then ends the body early WITHOUT an error —
    //      pipeline() resolves on that short body, so when the server told us
    //      the size up front we additionally require the bytes on disk to equal
    //      it. This is the "same size as the source file" guarantee.
    // The old (pre-regression) code streamed with a write loop that threw on an
    // early close; the refactor-era switch to a bare pipeline() dropped that,
    // letting a truncated CID-PMID.gz be accepted and poison the whole import.
    let downloadError;
    let downloaded = false;
    for (let attempt = 1; attempt <= MAX_DOWNLOAD_ATTEMPTS; attempt++) {
      try {
        debug.trace(
          `${filename}: downloading to ${downloadTmp} (attempt ${attempt}/${MAX_DOWNLOAD_ATTEMPTS})`,
        );
        const response = await fetchWithRetry(file.url, 'GET');
        await pipeline(response.body, createWriteStream(downloadTmp));
        const downloadedSize = statSync(downloadTmp).size;
        if (newFileSize !== -1 && downloadedSize !== newFileSize) {
          throw new Error(
            `incomplete body: ${downloadedSize}/${newFileSize} bytes`,
          );
        }
        downloaded = true;
        break;
      } catch (error) {
        downloadError =
          error instanceof Error ? error : new Error(String(error));
        debug.warn(
          `${filename}: download attempt ${attempt}/${MAX_DOWNLOAD_ATTEMPTS} failed: ${downloadError.message}`,
        );
        rmSync(downloadTmp, { force: true });
        if (attempt < MAX_DOWNLOAD_ATTEMPTS) {
          await delay(
            Math.min(RETRY_BASE_DELAY * 2 ** (attempt - 1), RETRY_MAX_DELAY),
          );
        }
      }
    }
    if (!downloaded) {
      throw new Error(
        `Could not fully download ${filename} after ${MAX_DOWNLOAD_ATTEMPTS} attempts: ${downloadError?.message}`,
      );
    }

    // Download succeeded — now it is safe to archive the previous copies.
    if (!existsSync(join(targetFolder, PREVIOUS_FOLDER, modificationDate))) {
      mkdirpSync(join(targetFolder, PREVIOUS_FOLDER, modificationDate));
    }
    for (const localFile of fileList) {
      const src = join(targetFolder, localFile.name);
      // A prior interrupted run can leave a listed file that no longer exists
      // on disk; skip it instead of throwing ENOENT and aborting the sync.
      if (!existsSync(src)) continue;
      renameSync(
        src,
        join(targetFolder, PREVIOUS_FOLDER, modificationDate, localFile.name),
      );
    }
    // Retain only the latest few archived versions to bound disk usage.
    prunePreviousVersions(targetFolder);

    // Move the freshly downloaded temp file into its final name.
    renameSync(downloadTmp, targetFile);
    target = targetFile;
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
