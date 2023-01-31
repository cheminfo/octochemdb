import { readdir, lstat } from 'fs/promises';

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
