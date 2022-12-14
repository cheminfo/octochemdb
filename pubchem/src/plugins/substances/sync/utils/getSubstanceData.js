import fetch from 'cross-fetch';
import delay from 'delay';
import OCL from 'openchemlib';

import Debug from '../../../../utils/Debug.js';
/**
 * @description calculate the ocl substance data
 * @param {*} molecule data of the molecule in substance file
 * @returns {Promise} ocl molecule data
 */

export async function getSubstanceData(molecule) {
  const debug = Debug('getSubstanceData');

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
    while (!success && count < 3) {
      try {
        dataSubstance = await fetch(
          `http://192.168.160.2:20822/v1/fromIDCode?idCode=${urlIDCode}`,
        );
        if (dataSubstance.ok) {
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
    if (dataSubstance?.ok) {
      let data = await dataSubstance.json();
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
      debug(`Error: ${dataSubstance?.status} ${dataSubstance}`);
    }
  } catch (e) {
    debug(e);
  }
}
