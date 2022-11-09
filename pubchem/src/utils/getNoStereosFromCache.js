import Debug from './Debug.js';

const debug = Debug('parseGNPs');

export async function getNoStereosFromCache(molecule, connection) {
  try {
    let idCode = molecule.getIDCode();

    let urlIDCode = encodeURIComponent(idCode);
    const oclID = molecule.getIDCodeAndCoordinates();
    let dataCompound = await fetch(
      `http://powernuc.cheminfo.org/v1/fromIDCode?idCode=${urlIDCode}`,
    );
    // if fetch request failed re try 3 times
    let count = 0;
    while (!dataCompound.ok && count < 3) {
      dataCompound = await fetch(
        `http://powernuc.cheminfo.org/v1/fromIDCode?idCode=${urlIDCode}`,
      );
      count++;
    }
    if (dataCompound.ok) {
      let data = await dataCompound.json();
      let ocl = {
        idCode: data.result.idCode,
        coordinates: oclID.coordinates,
        index: data.result.ssIndex,
        noStereoID: data.result.noStereoID,
        noStereoTautomerID: data.result.noStereoTautomerID,
      };
      return ocl;
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'gnps', connection, stack: e.stack });
    }
  }
}
