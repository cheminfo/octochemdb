import delay from 'delay';
import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';
/**
 * @description get associated CIDs from SIDs
 * @param {Array} sids  array of SIDs
 * @returns {Promise} array of CIDs associated to the SIDs (meaning also parents CIDs like deprotonated forms)
 */
export async function getCIDfromSID(sids) {
  const debug = debugLibrary('getSubstanceData');

  try {
    let count = 0;
    let success = false;
    let dataSubstance;
    while (success === false && count < 3) {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1000 * 1800);
        // convert Sids array to string separated by commas
        let stringSIDs = sids.join(',');

        let urlSIDs = encodeURIComponent(stringSIDs);

        if (process.env.NODE_ENV === 'test') {
          dataSubstance = await fetch(
            `https://octo.cheminfo.org/substances/v1/ids?ids=${urlSIDs}`,
            {
              signal: controller.signal,
            },
          );
        } else {
          dataSubstance = await fetch(
            `${process.env.SUBSTANCES_ROUTE}${urlSIDs}`,
            {
              signal: controller.signal,
            },
          );
        }
      } catch (e) {
        debug.fatal(e);
      }
      if (dataSubstance?.status === 200) {
        success = true;
      } else {
        await delay(1000);
      }
      count++;
    }
    if (!success) {
      throw new Error('Failed to fetch data');
    }
    if (dataSubstance?.status === 200) {
      let substances = await dataSubstance.json();
      const cidsAssociatedSids = [];
      for (let substance of substances.data) {
        if (substance.data.compounds === undefined) continue;
        const cids = substance.data.compounds.map((compound) =>
          Number(compound.$id),
        );
        cidsAssociatedSids.push(...cids);
      }
      return cidsAssociatedSids;
    } else {
      debug.fatal(`Error: ${dataSubstance?.status} ${dataSubstance}`);
    }
  } catch (e) {
    debug.fatal(e);
  }
}
