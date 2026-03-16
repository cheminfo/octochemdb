import { Spectrum, MF } from 'mass-tools';
import { xNormed, xyObjectToXY } from 'ml-spectra-processing';
import { parseMSP } from 'msp-parser';
import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

const debug = debugLibrary('parseMassBank');

/**
 * Parses a MassBank MSP-format blob and yields one {@link MassBankEntry}
 * per valid record.  Each entry includes OCL structural data, best-peak
 * spectrum, molecular formula, and exact mass.
 *
 * @param {Buffer} blob - Raw MSP file content (as returned by `readFileSync`)
 * @param {OctoChemConnection | string} connection - Database connection (or `'test'`)
 * @yields {MassBankEntry}
 */
export async function* parseMassBank(blob, connection) {
  try {
    const parsedData = parseMSP(/** @type {any} */ (blob));
    for (const data of parsedData) {
      try {
        /** @type {MassBankMspRecord} */
        const record = /** @type {any} */ (data);
        /** @type {MassBankEntry} */
        const result = {};
        if (record.meta) {
          result._id = record.meta['DB#'];

          const oclMolecule = OCL.Molecule.fromSmiles(record.meta.SMILES);
          const mfInfo = new MF(
            oclMolecule.getMolecularFormula().formula,
          ).getInfo();

          let ocl = await getNoStereosFromCache(
            oclMolecule,
            connection,
            'massbank',
          );
          result.data = {
            ocl,
          };
          const dataPeaks = {
            x: record.variables.x.data,
            y: record.variables.y.data,
          };
          const spectrumToBeFilter = new Spectrum(dataPeaks);
          const minMaxX = spectrumToBeFilter.minMaxX();
          const slots = (minMaxX.max - minMaxX.min) / 0.1 - 1;
          xNormed(spectrumToBeFilter.data.y, {
            algorithm: 'max',
            output: spectrumToBeFilter.data.y,
          });
          const bestPeaks = spectrumToBeFilter.getBestPeaks({
            numberSlots: slots,
            numberCloseSlots: slots,
            limit: 100,
            threshold: 0.01,
          });
          const bestPeaksXY = xyObjectToXY(bestPeaks);
          // need to convert ion mode which is in all uppercase to lowercase with the first letter in uppercase
          let normalizedIonMode = record.meta.Ion_mode.toLowerCase();
          normalizedIonMode =
            normalizedIonMode.charAt(0).toUpperCase() +
            normalizedIonMode.slice(1);

          result.data.spectrum = {
            data: { x: bestPeaksXY.x, y: bestPeaksXY.y },
            numberOfPeaks: bestPeaks.length,
            instrument: record.meta.Instrument,
            ionSource: record.meta.Instrument_type,
            precursorMz: record.meta.PrecursorMZ,
            ionMode: normalizedIonMode,
            adduct: record.meta.Precursor_type,
            collisionEnergy: record.meta.Collision_energy,
            msLevel: record.meta.Spectrum_type
              .replace(/MS\/MS|MSMS/i, 'MS2')
              .replace(/MS/g, ''),
          };
          result.data.em = mfInfo.monoisotopicMass;
          result.data.mf = mfInfo.mf;
        }
        yield result;
      } catch (e) {
        if (connection) {
          const err = e instanceof Error ? e : new Error(String(e));
          debug.warn(err.message, {
            collection: 'massbank',
            connection,
            stack: err.stack,
          });
        }
        continue;
      }
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    await debug.fatal(err.message, {
      collection: 'massbank',
      connection,
      stack: err.stack,
    });
  }
}
