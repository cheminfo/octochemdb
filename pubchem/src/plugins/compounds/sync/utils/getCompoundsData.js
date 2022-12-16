import delay from 'delay';
import OCL from 'openchemlib';

import Debug from '../../../../utils/Debug.js';

const debug = Debug('getCompoundsData');
/**
 * @description Calculate compounds properties (e.g. charge, OCL ID, molecular formula, etc.)
 * @param {*} molecule molecule from pubchem file
 * @returns  compounds properties
 */
export async function getCompoundsData(molecule) {
  try {
    let oclMolecule;
    if (molecule.molfile) {
      oclMolecule = OCL.Molecule.fromMolfile(molecule.molfile);
    } else {
      oclMolecule = OCL.Molecule.fromIDCode(molecule.idCode);
    }
    let idCode = oclMolecule.getIDCode();
    const oclID = oclMolecule.getIDCodeAndCoordinates();
    let urlIDCode = encodeURIComponent(idCode);
    let success = false;
    let count = 0;
    let dataCompound;
    while (!success && count < 3) {
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
      //  console.log(data);
      let result = {
        data: {
          ocl: {
            idCode: data.result.idCode,
            coordinates: oclID.coordinates,
            index: data.result.ssIndex,
            noStereoID: data.result.noStereoID,
            noStereoTautomerID: data.result.noStereoTautomerID,

            acceptorCount: data.result.acceptorCount,
            donorCount: data.result.donorCount,
            logP: data.result.logP,
            logS: data.result.logS,
            polarSurfaceArea: data.result.polarSurfaceArea,
            rotatableBondCount: data.result.rotatableBondCount,
            stereoCenterCount: data.result.stereoCenterCount,
          },
          mf: data.result.mf,
          em: data.result.em,
          charge: data.result.charge,
          mw: data.result.mw,
          nbFragments: data.result.nbFragments,
          atom: data.result.atom,
          unsaturation: data.result.unsaturation,
        },
      };

      return result;
    } else {
      debug(`Error: ${dataCompound?.status} ${dataCompound}`);
    }
  } catch (e) {
    debug(e);
  }
}
