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
    let urlIDCode = encodeURIComponent(idCode);
    let dataCompound = await fetch(
      `https://powernuc.cheminfo.org/v1/fromIDCode?idCode=${urlIDCode}`,
    );
    let data = await dataCompound.json();

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
      },
    };

    // calculate molecular formula properties (ex. exact mass, unsaturations, etc.)
    const mfInfo = new MF(result.data.mf).getInfo();
    result.data.unsaturation = mfInfo.unsaturation;
    result.data.atom = mfInfo.atoms;
  } catch (e) {
    debug(e);
  }
  return result;
}
