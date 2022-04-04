import { statSync } from 'fs';
import { join } from 'path';

import pkg from 'fs-extra';
import unzipper from 'unzipper';

import Debug from './Debug.js';

const { rmSync, existsSync, createReadStream, createWriteStream } = pkg;

const debug = Debug('unzipOneFile');

export async function unzipOneFile(
  targetFolderInput,
  lastFile,
  targetFileName,
) {
  const targetFolder = `${process.env.ORIGINAL_DATA_PATH}${targetFolderInput}`;
  const parts = lastFile.split('.');
  const modificationDate = parts[parts.length - 2];
  const updatedFileName = join(
    targetFileName
      .replace(/^.*\//, '')
      .replace(/(\.[^.]*$)/, `.${modificationDate}$1`),
  );
  debug(`Need to decompress: ${lastFile}`);
  let sizeFile;
  await new Promise((resolve, reject) => {
    createReadStream(lastFile)
      .pipe(unzipper.Parse())
      .on('entry', function (entry) {
        const fileName = entry.path;
        const type = entry.type; // 'Directory' or 'File'
        const size = entry.vars.uncompressedSize;
        if (type === 'File' && fileName.includes(targetFileName)) {
          sizeFile = size;
          if (!existsSync(join(targetFolder, updatedFileName))) {
            entry.pipe(createWriteStream(join(targetFolder, updatedFileName)));
          } else {
            debug(`File already exists`);
            entry.autodrain();
          }
        } else {
          entry.autodrain();
        }
      })
      .on('close', () => {
        if (
          sizeFile === statSync(join(targetFolder, updatedFileName)).size &&
          existsSync(join(targetFolder, updatedFileName)) === true
        ) {
          resolve();
          debug('File has the expected size');
        } else {
          if (existsSync(join(targetFolder, updatedFileName))) {
            rmSync(join(targetFolder, updatedFileName), { recursive: true });
          }
          debug('Error: file has not the expected size');
          reject('wrong file size');
        }
      })
      .on('error', (e) => {
        reject(e);
      });
  });
  debug(`Uncompressed done: ${updatedFileName}`);
  const unzipedFile = join(targetFolder, updatedFileName);
  return unzipedFile;
}
