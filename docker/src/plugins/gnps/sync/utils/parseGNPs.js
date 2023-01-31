import pkg from 'fs-extra';
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
        // Get spectrum peaks
        let data = {
          x: [],
          y: [],
        };
        let peaks = JSON.parse(entry.value.peaks_json)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 1000)
          .sort((a, b) => a[0] - b[0]); //centroid
        for (let peak of peaks) {
          data.x.push(peak[0]);
          data.y.push(peak[1]);
        }
        spectrum.data = data;
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