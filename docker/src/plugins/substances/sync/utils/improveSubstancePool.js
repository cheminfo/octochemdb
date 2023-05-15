import { cpus } from 'os';

import { AbortController } from 'abort-controller';
import delay from 'delay';
import Piscina from 'piscina';

import DebugLibrary from '../../../../utils/Debug.js';

// eslint-disable-next-line new-cap
const debug = DebugLibrary('improveSubstancePool');
const url = new URL('improveSubstance.js', import.meta.url);
const nbCPU = cpus().length;
const piscina = new Piscina({
  filename: url.pathname,
  minThreads: nbCPU,
  maxThreads: nbCPU,
  idleTimeout: 1000,
});

/**
 * @description Multithread import of substances
 * @param molecule
 * @param {object} [options={}]
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
    .catch((e) => {
      debug.warn(e);
      return undefined;
    });
  return {
    promise,
  };
}
