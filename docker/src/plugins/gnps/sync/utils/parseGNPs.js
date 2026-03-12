import pkg from 'fs-extra';
import { Spectrum, MF } from 'mass-tools';
import { xNormed, xy2ToXY, xyObjectToXY } from 'ml-spectra-processing';
import OCL from 'openchemlib';
import pkg2 from 'stream-json/streamers/StreamArray.js';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

const { createReadStream } = pkg;
const StreamArray = pkg2;
const debug = debugLibrary('parseGNPs');

/**
 * Parses a GNPS JSON library dump file and yields one `GnpsEntry` document
 * per valid spectrum record, ready to be upserted into MongoDB.
 *
 * For each JSON object the function:
 *  1. Skips entries with whitespace in the SMILES, `"N/A"` SMILES, or
 *     `"N/A"` peak data.
 *  2. Resolves the OCL structural representation (idCode, noStereoTautomerID,
 *     coordinates) from the SMILES string via `getNoStereosFromCache`.
 *  3. Computes the molecular formula and exact mass from the OCL molecule.
 *  4. Extracts spectrum metadata and filters/normalises the peak list.
 *  5. Assembles and yields the final `GnpsEntry` document.
 *
 * Per-row errors (e.g. an unparseable SMILES) are logged via `debug.error`
 * and the row is skipped; they are not re-thrown so that a single bad record
 * cannot abort the whole import.
 *
 * @param {string} jsonPath - Path to the GNPS JSON library dump file.
 * @param {OctoChemConnection} connection - Active database connection wrapper.
 * @yields {GnpsEntry}
 * @returns {AsyncGenerator<GnpsEntry>}
 */
export async function* parseGNPs(jsonPath, connection) {
  const jsonStream = StreamArray.withParser();
  createReadStream(jsonPath, 'utf8').pipe(jsonStream);
  try {
    for await (const entry of jsonStream) {
      /** @type {GnpsRawEntry} */
      const raw = entry.value;
      const regex = /\s/g;
      try {
        // skip entries with whitespace in SMILES, missing SMILES, or missing peaks
        if (
          regex.test(raw.Smiles) ||
          raw.Smiles === 'N/A' ||
          raw.peaks_json === 'N/A'
        ) {
          continue;
        }
        const oclMolecule = OCL.Molecule.fromSmiles(raw.Smiles);
        const mfInfo = new MF(
          oclMolecule.getMolecularFormula().formula,
        ).getInfo();

        const mf = mfInfo.mf;
        const em = mfInfo.monoisotopicMass;
        const ocl = await getNoStereosFromCache(
          oclMolecule,
          connection,
          'gnps',
        );
        // Build spectrum metadata
        /** @type {GnpsSpectrum} */
        const spectrum = {};
        if (raw.ms_level !== 'N/A') {
          spectrum.msLevel = Number(raw.ms_level);
        }
        if (raw.Ion_Source !== 'N/A') {
          spectrum.ionSource = raw.Ion_Source;
        }
        if (raw.Instrument !== 'N/A') {
          spectrum.instrument = raw.Instrument;
        }
        if (raw.Precursor_MZ !== 'N/A') {
          spectrum.precursorMz = Number(raw.Precursor_MZ);
        }
        if (raw.Adduct !== 'N/A') {
          spectrum.adduct = raw.Adduct;
        }
        if (raw.Ion_Mode !== 'N/A') {
          spectrum.ionMode = raw.Ion_Mode;
        }
        if (raw.Library_Class === '1') {
          spectrum.libraryQualityLevel = 'Gold';
        }
        if (raw.Library_Class === '2') {
          spectrum.libraryQualityLevel = 'Silver';
        }
        if (raw.Library_Class === '3') {
          spectrum.libraryQualityLevel = 'Bronze';
        }
        if (raw.Library_Class === '10') {
          spectrum.libraryQualityLevel = 'Challenge';
        }
        // Parse and filter spectrum peaks
        const entryPeaks = JSON.parse(raw.peaks_json);
        const dataPeaks = xy2ToXY(entryPeaks);
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
        // Assemble final document
        /** @type {GnpsEntry} */
        const result = {
          _id: raw.spectrum_id,
          data: {
            ocl,
            spectrum,
          },
        };
        if (mf) {
          result.data.mf = mf;
        }
        if (em) {
          result.data.em = em;
        }
        if (raw.Pubmed_ID !== 'N/A') {
          result.data.pmid = Number(raw.Pubmed_ID);
        }
        yield result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        if (connection) {
          debug.error(err.message, {
            collection: 'gnps',
            connection,
            stack: err.stack,
          });
        }
        continue;
      }
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'gnps',
        connection,
        stack: err.stack,
      });
    }
  }
}
