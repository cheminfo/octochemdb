import { MF } from 'mass-tools';
import delay from 'delay';
import fetch from 'node-fetch';
import OCL from 'openchemlib';
import { getMF } from 'openchemlib-utils';

import debugLibrary from '../../../../utils/Debug.js';

/**
 * Compute OpenChemLib descriptors and molecular properties for a substance.
 *
 * Parses the molecule from its molfile (or IDCode fallback), then queries
 * the external OCL-cache service (up to 3 retries with 1 s delay) to obtain
 * canonical identifiers, molecular formula, exact mass, etc.
 * @param molecule - parsed SDF molecule record (with `.molfile` or `.idCode`)
 * @returns substance data payload, or undefined on failure
 */
export async function getSubstanceData(molecule) {
  const debug = debugLibrary('getSubstanceData');

  try {
    // Parse the molecule from its molfile; fall back to IDCode if absent
    let oclMolecule;
    if (molecule.molfile) {
      oclMolecule = OCL.Molecule.fromMolfile(molecule.molfile);
    } else {
      oclMolecule = OCL.Molecule.fromIDCode(molecule.idCode);
    }
    const oclID = oclMolecule.getIDCodeAndCoordinates();
    const urlIDCode = encodeURIComponent(oclID.idCode);
    let count = 0;
    let success = false;
    let dataSubstance;
    // Retry up to 3 times to fetch computed properties from OCL-cache
    while (success === false && count < 3) {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1000 * 1800);
        if (process.env.NODE_ENV === 'test') {
          dataSubstance = await fetch(
            `https://ocl-cache.cheminfo.org/v1/fromIDCode?idCode=${urlIDCode}`,
            {
              signal: controller.signal,
            },
          );
        } else {
          dataSubstance = await fetch(`${process.env.OCL_CACHE}${urlIDCode}`, {
            signal: controller.signal,
          });
        }
      } catch (error) {
        debug.fatal(error);
      }
      if (dataSubstance?.status === 200) {
        success = true;
      } else {
        await delay(1000);
      }
      count++;
    }
    if (success && dataSubstance?.status === 200) {
      const data = await dataSubstance.json();
      const result = {
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

      // Attach atom-count map when available
      if (
        data.result.atoms !== null &&
        data.result.atoms !== undefined &&
        Object.keys(data.result.atoms).length > 0
      ) {
        result.data.atoms = data.result.atoms;
      } else {
        result.data.atoms = {};
      }
      return result;
    }

    debug.warn(
      `OCL cache unreachable for ${oclID.idCode}, computing locally`,
    );
    return computeSubstanceDataLocally(oclMolecule, oclID);
  } catch (error) {
    debug.fatal(error);
  }
}

export function computeSubstanceDataLocally(oclMolecule, oclID) {
  const mfString = getMF(oclMolecule).parts.sort().join('.');
  const mfInfo = new MF(mfString).getInfo();
  const fragmentMap = [];
  const nbFragments = oclMolecule.getFragmentNumbers(fragmentMap, false, false);

  let noStereoTautomerID = oclID.idCode;
  const small = mfInfo.atoms?.C === undefined || mfInfo.atoms.C <= 50;
  if (small) {
    noStereoTautomerID = OCL.CanonizerUtil.getIDCode(
      oclMolecule,
      OCL.CanonizerUtil.NOSTEREO_TAUTOMER,
    );
  }

  return {
    data: {
      ocl: {
        idCode: oclID.idCode,
        coordinates: oclID.coordinates,
        noStereoTautomerID,
      },
      mf: mfInfo.mf,
      em: mfInfo.monoisotopicMass,
      charge: mfInfo.charge,
      mw: mfInfo.mass,
      nbFragments,
      unsaturation: mfInfo.unsaturation,
      atoms: mfInfo.atoms && Object.keys(mfInfo.atoms).length > 0
        ? mfInfo.atoms
        : {},
    },
  };
}
