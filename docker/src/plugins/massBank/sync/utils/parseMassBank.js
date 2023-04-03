import { Spectrum } from 'mass-tools';
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
      let result = {};
      if (data.meta) {
        result._id = data.meta['DB#'];

        let oclMolecule = OCL.Molecule.fromSmiles(data.meta.SMILES);
        let ocl = await getNoStereosFromCache(oclMolecule, connection);
        result.data = {
          ocl,
        };
        let dataPeaks = { x: data.variables.x.data, y: data.variables.y.data };
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
        result.data.spectrum = bestPeaksXY;
        result.data.spectrum.numberOfPeaks = bestPeaks.length;
        result.data.spectrum.instrument = data.meta.Instrument;
        result.data.spectrum.instrumentType = data.meta.Instrument_type;
        result.data.spectrum.ionMode = data.meta.Ion_mode;
        result.data.spectrum.adduct = data.meta.Spectrum_type;
        result.data.spectrum.collisionEnergy = data.meta.Collision_energy;
        result.data.spectrum.msLevel = data.meta.Spectrum_type.replace(
          /MS/,
          '',
        );
      }
      yield result;
    }
  } catch (e) {
    debug(e.message, {
      collection: 'massbank',
      connection,
      stack: e.stack,
    });
  }
}
