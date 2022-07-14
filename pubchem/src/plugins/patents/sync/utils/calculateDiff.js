import { promises as FS } from 'fs';

import Debug from 'debug';

import appendDiff from './appendDiff.js';
import appendLines from './appendLines.js';

const debug = Debug.debug('calculateDiff');

export default async function calculateDiff(
  previousFilename,
  newFilename,
  destination,
) {
  debug('Starting');
  debug(`Previous file: ${previousFilename}`);
  debug(`Last file: ${newFilename}`);
  debug(`Diff file: ${destination}`);
  const previousFileHandle = await FS.open(previousFilename);
  const newFileHandle = await FS.open(newFilename);
  const destinationFileHandler = await FS.open(destination, 'w');

  const previousData = {
    productsIDs: {},
    residual: '',
    endOfFile: false,
  };

  const newData = {
    productsIDs: {},
    residual: '',
    endOfFile: false,
  };

  while (!(previousData.endOfFile && newData.endOfFile)) {
    while (
      Object.keys(previousData.productsIDs).length < 2 &&
      !previousData.endOfFile
    ) {
      await appendLines(previousFileHandle, previousData);
    }
    while (Object.keys(newData.productsIDs).length < 2 && !newData.endOfFile) {
      await appendLines(newFileHandle, newData);
    }

    await appendDiff(previousData, newData, destinationFileHandler);
  }

  await previousFileHandle.close();
  await newFileHandle.close();
  await destinationFileHandler.close();
  debug('Finishing');
}
