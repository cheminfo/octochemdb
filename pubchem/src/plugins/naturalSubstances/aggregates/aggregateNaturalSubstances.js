import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import Debug from '../../../utils/Debug.js';

export async function aggregate(connection) {
  const debug = Debug('naturalSubstances');
  const COLLECTION_NAME = 'naturalSubstances';
  try {
    const options = { collection: COLLECTION_NAME, connection: connection };
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
        `${COLLECTION_NAME}_tmp`,
      );
      debug('start Aggregation process');
      progress.state = 'aggregating';
      await connection.setProgress(progress);
      ////
      const result = await collectionSubstances
        .aggregate([
          {
            $match: { naturalProduct: true },
          },
          {
            $project: {
              _id: 1,
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
          cid.push(substance.data.cids[0]);
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
          Number(process.env.DEBUG_THROTTLING || 10000)
        ) {
          debug(`Processing: counter: ${counter} `);
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
      await targetCollection.createIndex({ _id: 1 });
      await targetCollection.createIndex({ _seq: 1 });
      await targetCollection.createIndex({ naturalProduct: 1 });
      await targetCollection.createIndex({ 'data.ocl.noStereoID': 1 });
      debug('Aggregation Done');
    } else {
      debug(`Aggregation already up to date`);
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'naturalSubstances', connection });
    }
  }
}
