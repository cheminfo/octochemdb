import Debug from '../../../utils/Debug.js';
import { getTaxonomiesForCmaupsAndNpasses } from '../../activesOrNaturals/utils/utilsTaxonomies/getTaxonomiesForCmaupsAndNpasses.js';
import { taxonomySynonyms } from '../../activesOrNaturals/utils/utilsTaxonomies/taxonomySynonyms.js';
import { getNormalizedActivities } from '../../cmaups/sync/utils/getNormalizedActivities.js';

import npassesStartSync from './utils/npassesStartSync.js';
import { parseNpasses } from './utils/parseNpasses.js';

const debug = Debug('syncNpasses');

export async function sync(connection) {
  try {
    const {
      lastDocumentImported,
      progress,
      sources,
      collection,
      general,
      activities,
      properties,
      speciesPair,
      speciesInfo,
      logs,
    } = await npassesStartSync(connection);
    const synonyms = await taxonomySynonyms();
    const collectionTaxonomies = await connection.getCollection('taxonomies');
    let counter = 0;
    let imported = 0;
    let start = Date.now();

    // Reimport collection again only if lastDocument imported changed or importation was not completed
    if (
      lastDocumentImported === null ||
      sources !== progress.sources ||
      progress.state !== 'updated'
    ) {
      const temporaryCollection = await connection.getCollection(
        'temporaryNpasses',
      );
      debug(`Start parsing npasses`);
      progress.state = 'updating';
      await connection.setProgress(progress);
      for await (const entry of parseNpasses(
        general,
        activities,
        properties,
        speciesPair,
        speciesInfo,
        connection,
      )) {
        counter++;
        if (process.env.TEST === 'true' && counter > 20) break;

        if (
          Date.now() - start >
          Number(process.env.DEBUG_THROTTLING || 10000)
        ) {
          debug(`Processing: counter: ${counter} - imported: ${imported}`);
          start = Date.now();
        }
        /// Normalize Taxonomies
        if (entry.data.taxonomies) {
          let taxonomies = await getTaxonomiesForCmaupsAndNpasses(
            entry,
            collectionTaxonomies,
            synonyms,
            'npasses',
          );
          entry.data.taxonomies = taxonomies;
        }
        if (entry.data.activities) {
          let activities = await getNormalizedActivities(
            entry,
            collectionTaxonomies,
            synonyms,
            'npasses',
          );
          entry.data.activities = activities;
        }
        entry._seq = ++progress.seq;

        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );

        imported++;
      }
      await temporaryCollection.rename('npasses', {
        dropTarget: true,
      });
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      progress.sources = sources;
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      await collection.createIndex({ _id: 1 });
      await collection.createIndex({ _seq: 1 });
      await collection.createIndex({ 'data.ocl.noStereoID': 1 });

      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }
    // we remove all the entries that are not imported by the last file
  } catch (e) {
    const optionsDebug = { collection: 'npasses', connection };
    debug(e, optionsDebug);
  }
}
