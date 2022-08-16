import { createReadStream, createWriteStream, statSync } from 'fs';
import { join } from 'path';

import pkg from 'fs-extra';
import unzipper from 'unzipper';

import Debug from '../../../../utils/Debug.js';

const { existsSync, rmSync } = pkg;

const debug = Debug('unzipFile');

export async function unzipFile(inputFilename) {
  // file output will have extension .xml instead of zip extension
  const outputFilename = inputFilename.replace(/\.zip$/, '.xml');
  if (existsSync(outputFilename)) {
    return outputFilename;
  }
  debug(`Unzipping ${inputFilename} to ${outputFilename}`);
  let sizeFile;
  await new Promise((resolve, reject) => {
    createReadStream(inputFilename)
      .pipe(unzipper.Parse())
      .on('entry', (entry) => {
        const type = entry.type; // 'Directory' or 'File'
        const size = entry.vars.uncompressedSize;

        // check if is a xml file and if it is the one we are looking for
        if (type === 'File' && entry.path.includes('.xml')) {
          if (!existsSync(outputFilename)) {
            sizeFile = size;
            entry.pipe(createWriteStream(outputFilename));
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
          sizeFile === statSync(outputFilename).size &&
          existsSync(outputFilename) === true
        ) {
          resolve();
          debug('File has the expected size');
          rmSync(inputFilename);
        } else {
          if (existsSync(outputFilename)) {
            rmSync(outputFilename, { recursive: true });
          }
          debug('Error: file has not the expected size');
        }
      })
      .on('error', (e) => {
        reject(e);
      });
  });

  return join(outputFilename);
}