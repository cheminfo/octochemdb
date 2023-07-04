import { reactionFragmentation } from 'mass-tools';
import md5 from 'md5';
import OCL from 'openchemlib';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import debugLibrary from '../../../utils/Debug.js';

const { Molecule } = OCL;

export async function aggregate(connection) {
  const debug = debugLibrary('inSilicoFragments');
  try {
    // Get collections from the database
    const options = { collection: 'inSilicoFragments', connection };
    const progress = await connection.getProgress(options.collection);
    const progressOfSourceCollection = await connection.getProgress(
      'activesOrNaturals',
    );
    const collectionActivesOrNaturals = await connection.getCollection(
      'activesOrNaturals',
    );
    const sources = md5(progressOfSourceCollection);
    // Add logs to the collection importLogs
    const logs = await connection.getImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    // Get the last document imported
    const lastDocumentImported = await getLastDocumentImported(
      options.connection,
      progress,
      options.collection,
    );

    if (
      lastDocumentImported === null ||
      sources !== progress.sources ||
      progress.state !== 'updated'
    ) {
      const temporaryCollection = await connection.getCollection(
        `${options.collection}_tmp`,
      );
      debug.info('start fragmentation process');
      progress.state = 'aggregating';
      await connection.setProgress(progress);
      let entries = await collectionActivesOrNaturals
        .aggregate([
          {
            $project: {
              _id: 0,
              idCode: '$data.noStereoOCL.idCode',
              noStereoTautomerID: '$_id',
            },
          },
        ])
        .toArray();

      debug.trace(
        `Loaded ${entries.length} noStereoTautomerIDs from activesOrNaturals`,
      );
      let fragmentationOptions = {
        database: 'cid',
        mode: 'positive',
        maxDepth: 10,
      };
      for (const entry of entries) {
        let result = {
          _id: entry.noStereoTautomerID,
          data: {
            ocl: { idCode: entry.idCode },
          },
        };
        let molecule = Molecule.fromIDCode(entry.idCode);
        const fragments = reactionFragmentation(molecule, fragmentationOptions);
        result.data.tree = { positive: fragments.tree };
        result.data.masses = { positive: fragments.masses };
        fragmentationOptions.mode = 'negative';
        const fragmentsNegative = reactionFragmentation(
          molecule,
          fragmentationOptions,
        );
        result.data.tree.negative = fragmentsNegative.tree;
        result.data.masses.negative = fragmentsNegative.masses;
        await temporaryCollection.updateOne(
          { _id: entry.noStereoTautomerID },
          { $set: result },
          { upsert: true },
        );
      }
      await temporaryCollection.createIndex({ 'data.masses.positive': 1 });
      await temporaryCollection.createIndex({ 'data.masses.negative': 1 });
      await temporaryCollection.createIndex({ 'data.ocl.idCode': 1 });
      // rename temporary collection
      await temporaryCollection.rename(options.collection, {
        dropTarget: true,
      });
      // update logs
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'aggregated';
      await connection.updateImportationLog(logs);
      // update progress
      progress.sources = sources;
      progress.dateEnd = Date.now();
      progress.state = 'aggregated';
      await connection.setProgress(progress);
      await debug.info('Aggregation Done');
    } else {
      await debug.info(`Aggregation already up to date`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'inSilicoFragments',
        connection,
        stack: e.stack,
      });
    }
  }
}
