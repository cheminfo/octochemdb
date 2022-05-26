/* eslint-disable no-inner-declarations */
import fs from 'fs';
import zlib from 'zlib';

import { parse } from 'sdf-parser';

import Debug from '../../../../utils/Debug.js';
//import { getTaxonomiesSubstances } from '../../../activesOrNaturals/utils/utilsTaxonomies/getTaxonomiesSubstances.js';
//import { taxonomySynonyms } from '../../../activesOrNaturals/utils/utilsTaxonomies/taxonomySynonyms.js';

import improveSubstancePool from './improveSubstancePool.js';

const debug = Debug('improveOneSubstanceFile');

export default async function importOneSubstanceFile(
  connection,
  progress,
  file,
  options,
) {
  try {
    const collection = await connection.getCollection('substances');
    const logs = await connection.geImportationLog({
      collectionName: 'substances',
      sources: file.name,
      startSequenceID: progress.seq,
    });
    /*const synonyms = await taxonomySynonyms();
    const collectionTaxonomies = await connection.getCollection('taxonomies');*/

    debug(`Importing: ${file.name}`);
    // should we directly import the data how wait that we reach the previously imported information
    let { shouldImport = true, lastDocument } = options;
    let bufferValue = '';
    let newSubstances = 0;
    const readStream = fs.createReadStream(file.path);
    const unzipStream = readStream.pipe(zlib.createGunzip());
    for await (const chunk of unzipStream) {
      bufferValue += chunk;
      if (bufferValue.length < 128 * 1024 * 1024) continue;
      let lastIndex = bufferValue.lastIndexOf('$$$$');
      if (lastIndex > 0 && lastIndex < bufferValue.length - 5) {
        newSubstances += await parseSDF(
          bufferValue.substring(0, lastIndex + 5),
        );
        bufferValue = bufferValue.substring(lastIndex + 5);
      }
    }
    newSubstances += await parseSDF(bufferValue);
    logs.dateEnd = Date.now();
    logs.endSequenceID = progress.seq;
    logs.status = 'updated';
    await connection.updateImportationLog(logs);
    debug(`${newSubstances} substances imported from ${file.name}`);
    return newSubstances;

    async function parseSDF(sdf) {
      let substances = parse(sdf).molecules;
      debug(`Need to process ${substances.length} substances`);

      if (process.env.TEST === 'true') substances = substances.slice(0, 10);
      const actions = [];
      for (let substance of substances) {
        if (!shouldImport) {
          if (substance.PUBCHEM_SUBSTANCE_ID !== lastDocument._id) {
            continue;
          }
          shouldImport = true;
          debug(`Skipping substances till: ${lastDocument._id}`);
          continue;
        }
        actions.push(
          improveSubstancePool(substance)
            .then((result) => {
              /*    if (result.data.taxonomyIDs) {
                let taxonomies = getTaxonomiesSubstances(
                  result,
                  collectionTaxonomies,
                  synonyms,
                );
                result.data.taxonomies = taxonomies;
              }*/
              result._seq = ++progress.seq;
              return collection.updateOne(
                { _id: result._id },
                { $set: result },
                { upsert: true },
              );
            })
            .then(() => {
              progress.sources = file.path.replace(
                process.env.ORIGINAL_DATA_PATH,
                '',
              );
              return connection.setProgress(progress);
            }),
        );
      }
      newSubstances += actions.length;
      await Promise.all(actions);
      debug(`${newSubstances} substances processed`);

      // save the substances in the database
      return substances.length;
    }
  } catch (e) {
    const optionsDebug = { collection: 'substances', connection };
    debug(e, optionsDebug);
  }
}
