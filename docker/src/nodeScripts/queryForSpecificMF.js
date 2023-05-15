import OCLE from 'openchemlib-extended';

import debugLibrary from '../utils/Debug.js';

const debug = debugLibrary('queryForSpecificMF');
const limit = 10000000;

const octoChemConnection = new (require('../utils/OctoChemConnection'))();

search()
  .catch((e) => debug.error(e.stack))
  .then(() => {
    debug.info('Done');
    octoChemConnection.close();
  });

async function search() {
  const collection = (await octoChemConnection.getDatabase()).collection(
    'data',
  );
  debug.trace('connected to MongoDB');

  let done = 0;
  const cursor = collection
    .find({
      charge: 0,
      nbFragments: 1,
      mf: { $regex: /^C[0-9]*H[0-9]*F?[0-9]*N?[0-9]*O?[0-9]*S?[0-9]*$/ },
      'mf.atom.C': { $lt: 8 },
    })
    .limit(limit);
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const mf = doc.mf;
    const total =
      (doc.atom.C || 0) +
      (doc.atom.F || 0) +
      (doc.atom.N || 0) +
      (doc.atom.O || 0) +
      (doc.atom.S || 0);

    if (done % 1000 === 0) {
      debug.trace(`${new Date()},${done}, '- Current _id:', ${doc._id}`);
      debug.trace(`${mf}, ${total}`);
    }

    done++;

    if (total > 8) continue;
    const mol = OCLE.Molecule.fromIDCode(doc.ocl.id, doc.ocl.coord);
    const smiles = mol.toSmiles();
    debug.trace(`${mf}\t${total}\t${smiles}`);
  }
}
