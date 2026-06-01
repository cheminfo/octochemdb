import { cpus } from 'node:os';

import delay from 'delay';
import Piscina from 'piscina';

import DebugLibrary from '../../../../utils/Debug.js';

// eslint-disable-next-line new-cap
const debug = DebugLibrary('improveSubstancePool');
const url = new URL('improveSubstance.js', import.meta.url);
let nbCPU = cpus().length;
const cpuLimit = Number.parseInt(process.env.IMPORT_CPUS, 10);
if (Number.isFinite(cpuLimit) && cpuLimit > 0) {
  nbCPU = Math.min(nbCPU, cpuLimit);
}
if (process.env.NODE_ENV === 'test') {
  nbCPU = 1;
}
const piscina = new Piscina({
  filename: url.pathname,
  minThreads: nbCPU,
  maxThreads: nbCPU,
  idleTimeout: 1000,
});

/**
 * @description Multithread import of substances
 * @param molecule
 * @param [options={}]
 * @returns result to be imported
 */
export default async function improveSubstancePool(molecule, options = {}) {
  const timeForTimeout = options.timeout || 60000;
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeForTimeout);

  while (piscina.queueSize > nbCPU * 5) {
    await delay(1);
  }
  let promise;
  promise = piscina
    .run(molecule, { signal: abortController.signal })
    .then((info) => {
      clearTimeout(timeout);
      return info;
    })
    .catch((error) => {
      debug.info(error);
    });
  return {
    promise,
  };
}
