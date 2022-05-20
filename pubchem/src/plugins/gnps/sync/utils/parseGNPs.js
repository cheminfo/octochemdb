import OCL from 'openchemlib';
import pkg from 'fs-extra';
import Debug from '../../../../utils/Debug.js';
import pkg2 from 'stream-json/streamers/StreamArray.js';
const { createReadStream } = pkg;
const StreamArray = pkg2;

export async function* parseGNPs(jsonPath, connection) {
  const debug = Debug('parseNpatlases');

  const jsonStream = StreamArray.withParser();
  createReadStream(jsonPath, 'utf8').pipe(jsonStream);
  try {
    for await (const entry of jsonStream) {
      try {
        if (
          entry.value.Smiles === 'N/A' ||
          entry.value.peaks_json === 'N/A' ||
          entry.value.Library_Class === (3 || 10) // GNPS classify spectra in 4 categories, gold silver bronze(incomplete data are allowed) challenge(unkown identity is allowed)
        ) {
          continue;
        }
        const oclMolecule = OCL.Molecule.fromSmiles(entry.value.Smiles);
        const oclID = oclMolecule.getIDCodeAndCoordinates();
        oclMolecule.stripStereoInformation();
        const noStereoID = oclMolecule.getIDCode();
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

        let spectrum = {
          x: [],
          y: [],
        };
        let peaks = JSON.parse(entry.value.peaks_json); //centroid
        for (let peak of peaks) {
          spectrum.x.push(peak[0]);
          spectrum.y.push(peak[1]);
        }
        if (spectrum.y.length > 1000) {
          let copySpectrumInt = [...spectrum.y];
          copySpectrumInt
            .sort(function (a, b) {
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
        const result = {
          _id: entry.value.spectrum_id,
          data: {
            ocl: {
              id: oclID.idCode,
              coordinates: oclID.coordinates,
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
        continue;
      }
    }
  } catch (e) {
    const optionsDebug = { collection: 'gnps', connection };
    debug(e, optionsDebug);
  }
}
