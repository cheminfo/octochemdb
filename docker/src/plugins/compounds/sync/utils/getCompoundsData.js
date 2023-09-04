import delay from 'delay';
import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('getCompoundsData');
// node debug
/**
 * @description Calculate compounds properties (e.g. charge, OCL ID, molecular formula, etc.)
 * @param {*} molecule molecule from pubchem file
 * @returns  compounds properties
 */
export async function getCompoundsData(molecule, options = {}) {
  //console.log(OCL.Molecule.fromIDCode(molecule.idCode));

  if (!('indexRequired' in options)) {
    options.indexRequired = true;
  }
  try {
    let oclMolecule;
    if (molecule.molfile) {
      oclMolecule = OCL.Molecule.fromMolfile(molecule.molfile);
    } else if (molecule.smiles) {
      oclMolecule = OCL.Molecule.fromSmiles(molecule.smiles);
    } else {
      oclMolecule = OCL.Molecule.fromIDCode(molecule.idCode);
    }
    const oclID = oclMolecule.getIDCodeAndCoordinates();

    let urlIDCode = encodeURIComponent(oclID.idCode);
    let success = false;
    let count = 0;
    let dataCompound;
    while (success === false && count < 3) {
      try {
        // workerpool does not access the .env file for some reason, this is a workaround
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
      let result = {
        data: {
          ocl: {
            idCode: data.result.idCode,
            coordinates: oclID.coordinates,
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
          atoms: data.result.atoms,
          unsaturation: data.result.unsaturation,
        },
      };
      if (options.indexRequired) {
        result.data.ocl.index = data.result.ssIndex;
      }
      return result;
    } else {
      debug.fatal(`Error: ${dataCompound?.status} ${dataCompound}`);
    }
  } catch (e) {
    debug.fatal(e);
  }
}
