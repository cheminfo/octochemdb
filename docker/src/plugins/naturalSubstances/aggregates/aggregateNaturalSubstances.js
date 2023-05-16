import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import debugLibrary from '../../../utils/Debug.js';

export async function aggregate(connection) {
  const debug = debugLibrary('naturalSubstances');
  try {
    const options = { collection: 'naturalSubstances', connection };
    const targetCollection = await connection.getCollection(options.collection);
    const compoundsCollection = await connection.getCollection('compounds');
    const progress = await connection.getProgress(options.collection);
    const taxonomyCollection = await connection.getCollection('taxonomies');
    const collectionSource = await connection.getProgress('substances');
    const collectionSubstances = await connection.getCollection('substances');
    const sources = md5(collectionSource);
    const logs = await connection.getImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    const lastDocumentImported = await getLastDocumentImported(
      options.connection,
      progress,
      options.collection,
    );

    if (
      lastDocumentImported === null ||
      sources !== progress.sources ||
      progress.state !== 'aggregated'
    ) {
      const temporaryCollection = await connection.getCollection(
        `${options.collection}_tmp`,
      );
      debug.info('start Aggregation process of naturalSubstances');
      progress.state = 'aggregating';
      await connection.setProgress(progress);
      ////
      const result = await collectionSubstances
        .aggregate([
          {
            $match: { 'data.naturalProduct': true },
          },
          {
            $project: {
              _id: 1,
              'data.taxonomies': 1,
              'data.ocl.noStereoTautomerID': 1,
            },
          },
        ])
        .toArray();
      let counter = 0;
      let start = Date.now();
      for (const entry of result) {
        let substance = await collectionSubstances.findOne({ _id: entry._id });

        let cid = [];
        if (substance?.data?.cids) {
          cid.push(substance.data.compounds[0]);
        }
        let compound = await compoundsCollection.findOne({
          _id: cid[0],
        });

        if (!compound) {
          continue;
        }
        let noStereoID = compound.data.ocl.noStereoID;
        let naturalResult = {
          _id: substance._id,
          data: {
            noStereoID,
            pmids: substance.data.pmids,
            comment: substance.data.comment,
            molfile: compound.data.molfile,
          },
          naturalProduct: true,
        };
        if (substance.data.taxonomyIDs) {
          let taxonomyIDs = substance.data.taxonomyIDs.map(Number);
          let taxonomies = await taxonomyCollection
            .find({ _id: { $in: taxonomyIDs } })
            .toArray();
          if (taxonomies.length > 1000) {
            taxonomies = taxonomies.slice(0, 1000);
          }
          if (taxonomies.length > 0) {
            let standardTaxonomies = taxonomies.map((taxonomy) => {
              return taxonomy.data;
            });
            naturalResult.data.taxonomies = standardTaxonomies;
          }
        }
        if (substance.data.patents) {
          naturalResult.data.patents = substance.data.patents;
        }
        if (substance.data.meshTerms) {
          naturalResult.data.meshTerms = substance.data.meshTerms;
        }
        naturalResult._seq = ++progress.seq;

        await temporaryCollection.updateOne(
          { _id: naturalResult._id },
          { $set: naturalResult },
          { upsert: true },
        );
        if (
          Date.now() - start >
          // @ts-ignore
          Number(process.env.DEBUG_THROTTLING)
        ) {
          debug.trace(`Processing: counter: ${counter} `);
          start = Date.now();
        }

        counter++;
      }
      await temporaryCollection.rename(options.collection, {
        dropTarget: true,
      });
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'aggregated';
      await connection.updateImportationLog(logs);
      progress.sources = sources;
      progress.dateEnd = Date.now();
      progress.state = 'aggregated';
      await connection.setProgress(progress);
      await targetCollection.createIndex({ naturalProduct: 1 });
      await targetCollection.createIndex({ _seq: 1 });
      await targetCollection.createIndex({ 'data.ocl.noStereoID': 1 });

      debug.info('Aggregation Done');
    } else {
      debug.info(`Aggregation already up to date`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'naturalSubstances',
        connection,
        stack: e.stack,
      });
    }
  }
}
