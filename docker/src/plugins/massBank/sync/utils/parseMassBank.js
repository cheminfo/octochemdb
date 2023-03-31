import { createInterface, createinterface } from 'readline';

import pkg from 'fs-extra';
import { Spectrum } from 'mass-tools';
import { xNormed, xy2ToXY, xyObjectToXY } from 'ml-spectra-processing';
import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

const { createReadStream } = pkg;
const debug = debugLibrary('parseGNPs');
export async function* parseMassBank(lines, connection) {
  // create a stream to read the file
  // read sql file dump without creating db

  //console.log(sql);
  let nextName;
  let reset = true;
  let result = {};
  let count = 0;
  result.spectrum = {};
  let spectraToBeParsed = [];
  for await (let line of lines) {
    let splitedLine = line.split(/\r?\n/);
    let spectraInfo = splitedLine[0].split(':');
    if (reset === true && count > 0) {
      spectraToBeParsed.length = 0;
      result.spectrum = {};
      result.spectrum.Name = nextName;
      reset = false;
    }
    if (spectraInfo.length > 1) {
      if (spectraInfo[0] === 'Name') {
        continue;
      }
      // if spectrainfo[0] includes #, remove it
      if (spectraInfo[0] === 'DB#') {
        result._id = spectraInfo[1];
      } else {
        spectraInfo[0] = spectraInfo[0].replace(/\s/g, '_');
        result.spectrum[spectraInfo[0]] = spectraInfo[1];
      }
    }
    if (spectraInfo.length === 1 && spectraInfo[0] !== '') {
      // regex to replace space between two numbers with a comma
      const spectraNotParsed = line.replace(/(\d)\s+(\d)/g, '$1,$2');
      // convert them to an array of numbers
      const spectra = spectraNotParsed.split(',').map(Number);

      spectraToBeParsed.push(spectra);
    }
    if (
      spectraToBeParsed.length > 0 &&
      spectraInfo[0] === 'Name' &&
      spectraInfo[1] !== result.spectrum.Name
    ) {
      let dataPeaks = xy2ToXY(spectraToBeParsed);
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

      ///
      result.spectrum.data = bestPeaksXY;
      result.spectrum.numberOfPeaks = bestPeaks.length;
      reset = true;
      nextName = spectraInfo[1];
      console.log(result);
      count++;
      yield result;
    }
  }
}
