import { open } from 'fs/promises';

import { parseStream } from 'arraybuffer-xml-parser';

import { getHStatements } from './getHStatements.js';
import { getPStatements } from './getPStatements.js';
import { getPictograms } from './getPictograms.js';
import { getRecords } from './getRecords.js';
import { getReferences } from './getReferences.js';
import { recursiveLowerCase } from './recursiveLowerCase.js';

export async function* parseLccs(filePath, { hCodes, pCodes }) {
  const fileStream = await open(filePath, 'r');
  const readableStream = fileStream.readableWebStream();

  // @ts-ignore
  for await (const entry of parseStream(readableStream, 'Record')) {
    let result = {};
    recursiveLowerCase(entry);
    // @ts-ignore
    if (entry.recordtype === 'CID') {
      result = {
        // @ts-ignore
        _id: entry.recordnumber,
        data: {},
      };

      let signals = {};
      let hCodesDescription = {};
      let pCodesDescription = {};
      let physicalProperties = [];
      let toxicalInformation = [];
      let exposureLimits = [];
      let healthAndSymptoms = [];
      let firstAid = [];
      let flammabilityAndExplosivity = [];
      let stabilityAndReactivity = [];
      let storageAndHandling = [];
      let cleanUpAndDisposal = [];
      // @ts-ignore
      let reference = getReferences(entry.reference);
      // @ts-ignore
      for (let info of entry.section) {
        if (info.tocheading === 'Cleanup and Disposal') {
          if (!Array.isArray(info.section)) {
            info.section = [info.section];
          }
          for (let property of info.section) {
            let records = getRecords(property, reference);
            cleanUpAndDisposal.push(records);
          }
        }
        if (info.tocheading === 'Storage and Handling') {
          if (!Array.isArray(info.section)) {
            info.section = [info.section];
          }
          for (let property of info.section) {
            let records = getRecords(property, reference);
            storageAndHandling.push(records);
          }
        }
        if (info.tocheading === 'Stability and Reactivity') {
          if (!Array.isArray(info.section)) {
            info.section = [info.section];
          }
          for (let property of info.section) {
            let records = getRecords(property, reference);
            stabilityAndReactivity.push(records);
          }
        }
        if (info.tocheading === 'Flammability and Explosivity') {
          if (!Array.isArray(info.section)) {
            info.section = [info.section];
          }
          for (let property of info.section) {
            let records = getRecords(property, reference);
            flammabilityAndExplosivity.push(records);
          }
        }
        if (info.tocheading === 'First Aid') {
          if (!Array.isArray(info.section)) {
            info.section = [info.section];
          }
          for (let property of info.section) {
            let firstAidInfo = getRecords(property, reference);
            firstAid.push(firstAidInfo);
          }
        }
        if (info.tocheading === 'Health and Symptoms') {
          if (!Array.isArray(info.section)) {
            info.section = [info.section];
          }
          for (let property of info.section) {
            let healthSymptoms = getRecords(property, reference);
            healthAndSymptoms.push(healthSymptoms);
          }
        }
        if (info.tocheading === 'Exposure Limits') {
          if (!Array.isArray(info.section)) {
            info.section = [info.section];
          }
          for (let property of info.section) {
            let limitsExposure = getRecords(property, reference);
            exposureLimits.push(limitsExposure);
          }
        }
        if (info.tocheading === 'Toxicity Information') {
          if (!Array.isArray(info.section)) {
            info.section = [info.section];
          }
          for (let toxicityInfo of info.section) {
            const Toxicity = getRecords(toxicityInfo, reference);
            toxicalInformation.push(Toxicity);
          }
        }
        if (info.tocheading === 'Physical Properties') {
          if (!Array.isArray(info.section)) {
            info.section = [info.section];
          }
          for (let property of info.section) {
            const properties = getRecords(property, reference);
            physicalProperties.push(properties);
          }
        }
        if (info.tocheading === 'GHS Classification') {
          result.data = {
            description: info.description,
          };

          for (let classification of info.information) {
            if (classification.name === 'Pictogram(s)') {
              result.data.pictograms = getPictograms(classification);
            }
            if (classification.name === 'Precautionary Statement Codes') {
              const codes = getPStatements(classification);

              for (let code of codes) {
                pCodesDescription[code] = pCodes[code];
              }
            }
            if (classification.name === 'Signal') {
              const currentSignal =
                classification.value.stringwithmarkup.string;
              signals[currentSignal] = true;
            }

            if (classification.name === 'GHS Hazard Statements') {
              hCodesDescription = getHStatements(
                classification,
                hCodes,
                hCodesDescription,
              );
            }
          }
        }
      }

      if (Object.keys(hCodesDescription).length > 0) {
        result.data.hCodesDescription = hCodesDescription;
      }
      if (Object.keys(pCodesDescription).length > 0) {
        result.data.pCodesDescription = pCodesDescription;
      }
      if (Object.keys(signals).length > 0) {
        result.data.signals = Object.keys(signals);
      }
      if (physicalProperties.length > 0) {
        result.data.physicalProperties = physicalProperties;
      }
      if (toxicalInformation.length > 0) {
        result.data.toxicalInformation = toxicalInformation;
      }
      if (exposureLimits.length > 0) {
        result.data.exposureLimits = exposureLimits;
      }
      if (healthAndSymptoms.length > 0) {
        result.data.healthAndSymptoms = healthAndSymptoms;
      }
      if (firstAid.length > 0) {
        result.data.firstAid = firstAid;
      }
      if (flammabilityAndExplosivity.length > 0) {
        result.data.flammabilityAndExplosivity = flammabilityAndExplosivity;
      }
      if (stabilityAndReactivity.length > 0) {
        result.data.stabilityAndReactivity = stabilityAndReactivity;
      }
      if (storageAndHandling.length > 0) {
        result.data.storageAndHandling = storageAndHandling;
      }
      if (cleanUpAndDisposal.length > 0) {
        result.data.cleanUpAndDisposal = cleanUpAndDisposal;
      }

      yield result;
    }
  }
}
