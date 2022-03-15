import { join } from 'path';

import fetch from 'cross-fetch';
import Debug from 'debug';
import FSExtra from 'fs-extra';

import getFile from '../../../../sync/http/utils/getFile.js';
import getFilesList from '../../../../sync/http/utils/getFilesList.js';

const { mkdirpSync, existsSync, statSync } = FSExtra;
const debug = Debug('syncFile');

async function syncNpAtlasFile(source, destinationFolder, options = {}) {
  if (!existsSync(destinationFolder)) {
    mkdirpSync(destinationFolder);
  }

  const file = {};
  file.name = 'NPAtlas_download';
  file.url = source;
  const response = await fetch(file.url);
  console.log(response);

  const newFiles = [];

  const targetFile = join(destinationFolder, file.name);
  file.path = targetFile;

  const files = await getFile(file, targetFile);
  console.log(files);
  newFiles.push(files);

  return { file, newFiles };
}

export default syncNpAtlasFile;
