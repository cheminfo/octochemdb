import fetch from 'cross-fetch';
import MFParser from 'mf-parser';
import OCL from 'openchemlib';

import Debug from '../../../../utils/Debug.js';

const { MF } = MFParser;
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
    let fragmentMap = [];
    let nbFragments = oclMolecule.getFragmentNumbers(fragmentMap, false, false);
    let urlIDCode = encodeURIComponent(idCode);
    let dataCompound = await fetch(
      `https://127.0.0.1:20822/v1/fromIDCode?idCode=${urlIDCode}`,
    );
    // if fetch request failed re try 3 times
    let count = 0;
    while (!dataCompound.ok && count < 3) {
      dataCompound = await fetch(
        `https://127.0.0.1:20822/v1/fromIDCode?idCode=${urlIDCode}`,
      );
      count++;
    }
    if (dataCompound.ok) {
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
          nbFragments,
        },
      };

      // calculate molecular formula properties (ex. exact mass, unsaturations, etc.)
      const mfInfo = new MF(result.data.mf).getInfo();
      result.data.unsaturation = mfInfo.unsaturation;
      result.data.atom = mfInfo.atoms;
      return result;
    } else {
      debug(`Error: ${dataCompound.status} ${dataCompound}`);
    }
  } catch (e) {
    debug(e);
  }
}
