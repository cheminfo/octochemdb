import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import debugLibrary from '../../../utils/Debug.js';
/**
 * @description Aggregate the active against data from the activeOrNaturals collection
 * @param {*} connection
 * @output {collection} activeAgainst collection
 */
export async function aggregate(connection) {
  const debug = debugLibrary('aggregateActiveAgainst');
  try {
    // Get collections from the database
    const options = { collection: 'activeAgainst', connection };
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
      // If the last document imported is null, or the sources are different, or the state is not updated, then we need to import the data
      const temporaryCollection = await connection.getCollection(
        `${options.collection}_tmp`,
      );
      debug.info('start Aggregation process');
      progress.state = 'aggregating';
      await connection.setProgress(progress);
      // Aggregate the data from the activesOrNaturals collection
      let dbRefs = await collectionActivesOrNaturals
        .aggregate(
          [
            { $project: { activities: '$data.activities' } },
            { $match: { activities: { $ne: [] } } },
            {
              $project: {
                _id: 0,
                activities: '$activities',
              },
            },
          ],
          {
            allowDiskUse: true, // allow aggregation to use disk if necessary
            maxTimeMS: 60 * 60 * 1000, // 1h
          },
        )
        .toArray();
      let start = Date.now();
      let count = 0;
      let total = dbRefs.length;

      dbRefs = dbRefs.filter((dbRef) => dbRef.activities !== undefined);

      for (let dbRef of dbRefs) {
        for (let activity of dbRef.activities) {
          let collectionActivity = await connection.getCollection(
            activity.collection,
          );
          let cursor = await collectionActivity.find({
            _id: activity.oid,
          });
          if (await cursor.hasNext()) {
            let entryActivity = await cursor.next();
            if (entryActivity.data?.targetTaxonomies) {
              for (let taxonomy of entryActivity.data.targetTaxonomies) {
                let entry = {
                  data: {},
                };
                if (taxonomy.superkingdom) {
                  entry.data.superkingdom = taxonomy.superkingdom;
                }
                if (taxonomy.kingdom) entry.data.kingdom = taxonomy.kingdom;
                if (taxonomy.phylum) entry.data.phylum = taxonomy.phylum;
                if (taxonomy.class) entry.data.class = taxonomy.class;
                if (taxonomy.order) entry.data.order = taxonomy.order;
                if (taxonomy.family) entry.data.family = taxonomy.family;
                if (taxonomy.genus) entry.data.genus = taxonomy.genus;
                let levels = Object.keys(entry.data);
                let id = '';
                for (let level of levels) {
                  id += `${entry.data[level]}`;
                }
                entry._id = id.replace(/\s/g, '');
                let cursor = await temporaryCollection.find({ _id: entry._id });
                if (!(await cursor.hasNext())) {
                  entry.count = 1;
                  await temporaryCollection.updateOne(
                    { _id: entry._id },
                    { $set: entry },
                    { upsert: true },
                  );
                } else {
                  await temporaryCollection.updateOne(
                    { _id: entry._id },
                    { $inc: { count: 1 } },
                    { upsert: true },
                  );
                }
                count++;
              }
            }
          }
        }
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          await debug.info(`Aggregation progress: ${count}/${total}`);
          start = Date.now();
        }
      }

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
        collection: 'activeAgainst',
        connection,
        stack: e.stack,
      });
    }
  }
}
