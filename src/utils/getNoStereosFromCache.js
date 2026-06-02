import delay from 'delay';
import fetch from 'node-fetch';
import OCL from 'openchemlib';

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
        if (process.env.NODE_ENV === 'test') {
          dataCompound = await fetch(
            `https://ocl-cache.cheminfo.org/v1/fromIDCode?idCode=${urlIDCode}`,
            {
              signal: controller.signal,
            },
          );
        } else {
          dataCompound = await fetch(`${process.env.OCL_CACHE}${urlIDCode}`, {
            signal: controller.signal,
          });
        }
      } catch (error) {
        debug.fatal(error);
      }
      if (dataCompound?.status === 200) {
        success = true;
      } else {
        await delay(1000);
      }
      count++;
    }
    if (success && dataCompound?.status === 200) {
      let data = await dataCompound.json();
      let ocl = {
        idCode: data.result.idCode,
        coordinates: oclID.coordinates,
        noStereoTautomerID: data.result.noStereoTautomerID,
      };
      return ocl;
    }

    debug.warn(`OCL cache unreachable for ${oclID.idCode}, computing locally`);
    return computeNoStereosLocally(molecule, oclID);
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: currentCollection,
        connection,
        stack: error.stack,
      });
    }
  }
}

export function computeNoStereosLocally(molecule, oclID) {
  return {
    idCode: oclID.idCode,
    coordinates: oclID.coordinates,
    noStereoTautomerID: OCL.CanonizerUtil.getIDCode(
      molecule,
      OCL.CanonizerUtil.NOSTEREO_TAUTOMER,
    ),
  };
}
