import delay from 'delay';

import Debug from './Debug.js';

const debug = Debug('fetchNoStereosFromCache');

export async function getNoStereosFromCache(molecule, connection) {
  try {
    let idCode = molecule.getIDCode();
    let urlIDCode = encodeURIComponent(idCode);
    const oclID = molecule.getIDCodeAndCoordinates();
    let success = false;
    let count = 0;
    let dataCompound;
    while (success === false && count < 3) {
      try {
        dataCompound = await fetch(
          `http://ocl-cache-docker-ocl-cache-1:20822/v1/fromIDCode?idCode=${urlIDCode}`,
        );
      } catch (e) {
        debug(e);
      }
      if (dataCompound?.ok) {
        success = true;
      } else {
        await delay(1000);
      }
      count++;
    }
    if (!success) {
      throw new Error('Failed to fetch data');
    }
    if (dataCompound?.ok) {
      let data = await dataCompound.json();
      let ocl = {
        idCode: data.result.idCode,
        coordinates: oclID.coordinates,
        index: data.result.ssIndex,
        noStereoID: data.result.noStereoID,
        noStereoTautomerID: data.result.noStereoTautomerID,
      };
      return ocl;
    } else {
      debug(`Error: ${dataCompound?.status} ${dataCompound}`);
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'gnps', connection, stack: e.stack });
    }
  }
}
