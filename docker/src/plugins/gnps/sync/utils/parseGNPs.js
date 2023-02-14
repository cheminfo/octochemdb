import pkg from 'fs-extra';
import { Spectrum } from 'mass-tools';
import { xNormed, xy2ToXY, xyObjectToXY } from 'ml-spectra-processing';
import OCL from 'openchemlib';
import pkg2 from 'stream-json/streamers/StreamArray.js';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

const { createReadStream } = pkg;
const StreamArray = pkg2;
const debug = debugLibrary('parseGNPs');
/**
 * @description Parse GNPs file and return data to be imported in GNPs collection
 * @param {*} jsonPath path to the GNPs file
 * @param {*} connection MongoDB connection
 * @yield {Promise} returns entries in gnps collection
 */
export async function* parseGNPs(jsonPath, connection) {
  // create a stream to read the file
  const jsonStream = StreamArray.withParser();
  createReadStream(jsonPath, 'utf8').pipe(jsonStream);
  try {
    for await (const entry of jsonStream) {
      const regex = /\s/g;
      try {
        // skip if the entry has no smiles, spectrum or a library class 3 or 10
        if (
          regex.test(entry.value.Smiles) ||
          entry.value.Smiles === 'N/A' ||
          entry.value.peaks_json === 'N/A'
        ) {
          continue;
        }
        // create a molecule from the entry smiles and get noStereoTautomerID
        // should get noStereoID, noStereoTautomer,  coordinates getNoStereosFromCache

        const oclMolecule = OCL.Molecule.fromSmiles(entry.value.Smiles);
        const ocl = await getNoStereosFromCache(oclMolecule, connection);
        // Get spectrum metadata
        let spectrum = {};
        if (entry.value.ms_level !== 'N/A') {
          spectrum.msLevel = Number(entry.value.ms_level);
        }
        if (entry.value.Ion_Source !== 'N/A') {
          spectrum.ionSource = entry.value.Ion_Source;
        }
        if (entry.value.Instrument !== 'N/A') {
          spectrum.instrument = entry.value.Instrument;
        }
        if (entry.value.Precursor_MZ !== 'N/A') {
          spectrum.precursorMz = Number(entry.value.Precursor_MZ);
        }
        if (entry.value.Adduct !== 'N/A') {
          spectrum.adduct = entry.value.Adduct;
        }
        if (entry.value.Ion_Mode !== 'N/A') {
          spectrum.ionMode = entry.value.Ion_Mode;
        }
        if (entry.value.Library_Class === '1') {
          spectrum.libraryQualityLevel = 'Gold';
        }
        if (entry.value.Library_Class === '2') {
          spectrum.libraryQualityLevel = 'Silver';
        }
        if (entry.value.Library_Class === '3') {
          spectrum.libraryQualityLevel = 'Bronze';
        }
        if (entry.value.Library_Class === '10') {
          spectrum.libraryQualityLevel = 'Challenge';
        }
        // Get spectrum peaks
        const entryPeaks = JSON.parse(entry.value.peaks_json);
        // convert entryPeaks to array
        let dataPeaks = xy2ToXY(entryPeaks);
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
        spectrum.data = bestPeaksXY;
        spectrum.numberOfPeaks = bestPeaks.length;
        // define final result to be imported in GNPs collection
        const result = {
          _id: entry.value.spectrum_id,
          data: {
            ocl,
            spectrum,
          },
        };

        if (entry.value.Pubmed_ID !== 'N/A') {
          result.data.pmid = Number(entry.value.Pubmed_ID);
        }
        yield result;
      } catch (e) {
        if (connection) {
          debug(e.message, { collection: 'gnps', connection, stack: e.stack });
        }
        continue;
      }
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'gnps', connection, stack: e.stack });
    }
  }
}
