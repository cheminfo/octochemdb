import { lstat, readdir } from 'node:fs/promises';

/**
 * Recursively walk a directory and return every regular file it contains.
 * Used by cron/route discovery to find plugin sync, aggregate and route
 * modules under `src/plugins/`.
 * @param url - Directory URL to walk.
 * @returns URLs of every file found (depth-first).
 */
export async function recursiveDir(url) {
  const files = [];
  await recursiveDirSS(url, files);
  return files;
}

async function recursiveDirSS(url, files) {
  const entries = await readdir(url);
  for (let entry of entries) {
    const entryURL = new URL(entry, `${url.href}/`);
    const stats = await lstat(entryURL);
    if (stats.isDirectory()) {
      await recursiveDirSS(entryURL, files);
    }
    if (stats.isFile()) {
      files.push(entryURL);
    }
  }
}
