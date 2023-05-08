import delay from 'delay';
import fetch from 'node-fetch';
import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
/**
 * @description calculate the ocl substance data
 * @param {*} molecule data of the molecule in substance file
 * @returns {Promise} ocl molecule data
 */

export async function getSubstanceData(molecule) {
  const debug = debugLibrary('getSubstanceData');

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
    let count = 0;
    let success = false;
    let dataSubstance;
    while (success === false && count < 3) {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1000 * 1800);
        if (process.env.NODE_ENV === 'test') {
          dataSubstance = await fetch(
            `https://ocl-cache.cheminfo.org/v1/fromIDCode?idCode=${urlIDCode}`,
            { signal: controller.signal },
          );
        } else {
          dataSubstance = await fetch(`${process.env.OCL_CACHE}${urlIDCode}`, {
            signal: controller.signal,
          });
        }
      } catch (e) {
        debug(e);
      }
      if (dataSubstance?.status === 200) {
        success = true;
      } else {
        await delay(1000);
      }
      count++;
    }
    if (!success) {
      throw new Error('Failed to fetch data');
    }
    if (dataSubstance?.status === 200) {
      let data = await dataSubstance.json();
      let result = {
        data: {
          ocl: {
            idCode: data.result.idCode,
            coordinates: oclID.coordinates,
            noStereoTautomerID: data.result.noStereoTautomerID,
          },
          mf: data.result.mf,
          em: data.result.em,
          charge: data.result.charge,
          mw: data.result.mw,
          nbFragments: data.result.nbFragments,
          unsaturation: data.result.unsaturation,
        },
      };

      if (
        data.result.atoms !== null &&
        data.result.atoms !== undefined &&
        Object.keys(data.result.atoms).length !== 0
      ) {
        result.data.atoms = JSON.parse(data.result.atoms);
      } else {
        result.data.atoms = {};
      }
      return result;
    } else {
      debug(`Error: ${dataSubstance?.status} ${dataSubstance}`);
    }
  } catch (e) {
    debug(e);
  }
}
