import delay from 'delay';

import debugLibrary from './Debug.js';

const debug = debugLibrary('fetchNoStereosFromCache');

export async function getNoStereosFromCache(
  molecule,
  connection,
  currentCollection,
) {
  try {
    const oclID = molecule.getIDCodeAndCoordinates();
    let urlIDCode = encodeURIComponent(oclID.idCode);

    let success = false;
    let count = 0;
    let dataCompound;
    while (success === false && count < 3) {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1000 * 1800);

        dataCompound = await fetch(`${process.env.OCL_CACHE}${urlIDCode}`, {
          signal: controller.signal,
        });
      } catch (e) {
        debug.fatal(e);
      }
      if (dataCompound?.status === 200) {
        success = true;
      } else {
        await delay(1000);
      }
      count++;
    }
    if (!success) {
      throw new Error('Failed to fetch data');
    }
    if (dataCompound?.status === 200) {
      let data = await dataCompound.json();
      let ocl = {
        idCode: data.result.idCode,
        coordinates: oclID.coordinates,
        noStereoTautomerID: data.result.noStereoTautomerID,
      };
      return ocl;
    } else {
      debug.fatal(`Error: ${dataCompound?.status} ${dataCompound}`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: currentCollection,
        connection,
        stack: e.stack,
      });
    }
  }
}
