import { Spectrum, MF } from 'mass-tools';
import { xNormed, xyObjectToXY } from 'ml-spectra-processing';
import { parseMSP } from 'msp-parser';
import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

const debug = debugLibrary('parseMassBank');
export async function* parseMassBank(blob, connection) {
  try {
    const parsedData = parseMSP(blob);
    for (let data of parsedData) {
      try {
        let result = {};
        if (data.meta) {
          result._id = data.meta['DB#'];

          let oclMolecule = OCL.Molecule.fromSmiles(data.meta.SMILES);
          const mfInfo = new MF(
            oclMolecule.getMolecularFormula().formula,
          ).getInfo();

          let ocl = await getNoStereosFromCache(oclMolecule, connection);
          result.data = {
            ocl,
          };
          let dataPeaks = {
            x: data.variables.x.data,
            y: data.variables.y.data,
          };
          let spectrumToBeFilter = new Spectrum(dataPeaks);
          let minMaxX = spectrumToBeFilter.minMaxX();
          let slots = (minMaxX.max - minMaxX.min) / 0.1 - 1;
          xNormed(spectrumToBeFilter.data.y, {
            algorithm: 'max',
            output: spectrumToBeFilter.data.y,
          });
          let bestPeaks = spectrumToBeFilter.getBestPeaks({
            numberSlots: slots,
            numberCloseSlots: slots,
            limit: 100,
            threshold: 0.01,
          });
          let bestPeaksXY = xyObjectToXY(bestPeaks);
          // need to convert ion mode which is in all uppercase to lowercase with the first letter in uppercase
          let normalizedIonMode = data.meta.Ion_mode.toLowerCase();
          normalizedIonMode =
            normalizedIonMode.charAt(0).toUpperCase() +
            normalizedIonMode.slice(1);

          result.data.spectrum = { data: {} };
          result.data.spectrum.data.x = bestPeaksXY.x;
          result.data.spectrum.data.y = bestPeaksXY.y;
          result.data.spectrum.numberOfPeaks = bestPeaks.length;
          result.data.spectrum.instrument = data.meta.Instrument;
          result.data.spectrum.ionSource = data.meta.Instrument_type;
          result.data.spectrum.precursorMz = data.meta.PrecursorMZ;
          result.data.spectrum.ionMode = normalizedIonMode;
          result.data.spectrum.adduct = data.meta.Precursor_type;
          result.data.spectrum.collisionEnergy = data.meta.Collision_energy;
          result.data.spectrum.msLevel = data.meta.Spectrum_type.replace(
            /MS/,
            '',
          );
          result.data.em = mfInfo.monoisotopicMass;
          result.data.mf = mfInfo.mf;
        }
        yield result;
      } catch (e) {
        if (connection) {
          debug.warn(e.message, {
            collection: 'massbank',
            connection,
            stack: e.stack,
          });
        }
        continue;
      }
    }
  } catch (e) {
    await debug.fatal(e.message, {
      collection: 'massbank',
      connection,
      stack: e.stack,
    });
  }
}
