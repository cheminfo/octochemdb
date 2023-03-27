import { cpus } from 'os';
import { join } from 'path';

import { AbortController } from 'abort-controller';
import delay from 'delay';
import Piscina from 'piscina';

import improveCompound from './improveCompound.js';

const nbCPU = cpus().length;
const piscina = new Piscina({
  filename: join(__dirname, 'improveCompound.js'),
  minThreads: nbCPU,
  maxThreads: nbCPU,
  idleTimeout: 1000,
});

/**
 * @description Multithread import of compounds
 * @param molecule
 * @returns result to be imported
 */
export default async function improveCompoundPool(molecule) {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 60000);

  // if in the queue we have over twice the number of cpu we wait
  while (piscina.queueSize > nbCPU * 2) {
    await delay(1);
  }
  let promise;
  try {
    promise = piscina
      .run(molecule, { signal: abortController.signal })
      .then((info) => {
        clearTimeout(timeout);
        return info;
      });
  } catch (e) {
    promise = Promise.resolve(improveCompound(molecule));
  }
  // seems a little bit complex to return an object with a promise but it allows to deal
  // with 'back pressure'
  // we will not resolve the promise if this process has to wait because piscina does not have enough space in the queue
  // by default we only allow 2 times the number of core in the piscina queue
  return {
    promise,
  };
}
