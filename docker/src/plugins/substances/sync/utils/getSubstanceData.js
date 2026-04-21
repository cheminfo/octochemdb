import delay from 'delay';
import fetch from 'node-fetch';
import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';

/**
 * Compute OpenChemLib descriptors and molecular properties for a substance.
 *
 * Parses the molecule from its molfile (or IDCode fallback), then queries
 * the external OCL-cache service (up to 3 retries with 1 s delay) to obtain
 * canonical identifiers, molecular formula, exact mass, etc.
 *
 * @param {object} molecule - parsed SDF molecule record (with `.molfile` or `.idCode`)
 * @returns {Promise<{data: object}|undefined>} substance data payload, or undefined on failure
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
      } catch (e) {
        debug.fatal(e);
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
        Object.keys(data.result.atoms).length !== 0
      ) {
        result.data.atoms = data.result.atoms;
      } else {
        result.data.atoms = {};
      }
      return result;
    } else {
      debug.fatal(`Error: ${dataSubstance?.status} ${dataSubstance}`);
    }
  } catch (e) {
    debug.fatal(e);
  }
}
