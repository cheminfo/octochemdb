import delay from 'delay';

import Debug from './Debug.js';

const debug = Debug('parseGNPs');

export async function getNoStereosFromCache(molecule, connection) {
  try {
    let idCode = molecule.getIDCode();
    let urlIDCode = encodeURIComponent(idCode);
    const oclID = molecule.getIDCodeAndCoordinates();
    let success = false;
    let count = 0;
    let dataCompound;
    while (!success && count < 3) {
      try {
        dataCompound = await fetch(
          `http://192.168.160.2:20822/v1/fromIDCode?idCode=${urlIDCode}`,
        );
        if (dataCompound.ok) {
          success = true;
        } else {
          delay(5000);
        }
        count++;
      } catch (e) {
        debug(e);
      }
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
