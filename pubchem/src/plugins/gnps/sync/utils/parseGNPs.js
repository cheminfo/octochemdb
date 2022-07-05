import pkg from 'fs-extra';
import OCL from 'openchemlib';
import pkg2 from 'stream-json/streamers/StreamArray.js';

import Debug from '../../../../utils/Debug.js';

const { createReadStream } = pkg;
const StreamArray = pkg2;
const debug = Debug('parseGNPs');
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
      try {
        // skip if the entry has no smiles, spectrum or a library class 3 or 10
        if (
          entry.value.Smiles === 'N/A' ||
          entry.value.peaks_json === 'N/A' ||
          entry.value.Library_Class === 10 ||
          entry.value.Library_Class === 3 // GNPS classify spectra in 4 categories, gold silver (10 and 3), bronze (incomplete data are allowed), challenge(unknown identity is allowed)
        ) {
          continue;
        }
        // create a molecule from the entry smiles and get noStereoID
        const oclMolecule = OCL.Molecule.fromSmiles(entry.value.Smiles);
        const oclID = oclMolecule.getIDCodeAndCoordinates();
        oclMolecule.stripStereoInformation();
        const noStereoID = oclMolecule.getIDCode();
        // Get spectrum metadata
        let spectralData = {};
        if (entry.value.ms_level !== 'N/A') {
          spectralData.msLevel = Number(entry.value.ms_level);
        }
        if (entry.value.Ion_Source !== 'N/A') {
          spectralData.ionSource = entry.value.Ion_Source;
        }
        if (entry.value.Instrument !== 'N/A') {
          spectralData.instrument = entry.value.Instrument;
        }
        if (entry.value.Precursor_MZ !== 'N/A') {
          spectralData.precursorMz = Number(entry.value.Precursor_MZ);
        }
        if (entry.value.Adduct !== 'N/A') {
          spectralData.adduct = entry.value.Adduct;
        }
        if (entry.value.Ion_Mode !== 'N/A') {
          spectralData.ionMode = entry.value.Ion_Mode;
        }
        // Get spectrum peaks
        let spectrum = {
          x: [],
          y: [],
        };
        let peaks = JSON.parse(entry.value.peaks_json); //centroid
        for (let peak of peaks) {
          spectrum.x.push(peak[0]);
          spectrum.y.push(peak[1]);
        }
        // if spectrum has more than 1000 peaks, keep most intense 1000 peaks
        if (spectrum.y.length > 1000) {
          let copySpectrumInt = [...spectrum.y];
          copySpectrumInt
            .sort((a, b) => {
              return b - a;
            })
            .slice(0, 999);
          let newSpectrum = {
            x: [],
            y: [],
          };
          for (let i = 0; i < spectrum.x.length; i++) {
            if (copySpectrumInt.includes(spectrum.y[i])) {
              newSpectrum.x.push(spectrum[i].x);
              newSpectrum.y.push(spectrum[i].y);
            }
          }
          spectrum = newSpectrum;
        }
        spectralData.spectrum = spectrum;
        // define final result to be imported in GNPs collection
        const result = {
          _id: entry.value.spectrum_id,
          data: {
            ocl: {
              idCode: oclID.idCode,
              noStereoID,
            },
            spectralData,
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
