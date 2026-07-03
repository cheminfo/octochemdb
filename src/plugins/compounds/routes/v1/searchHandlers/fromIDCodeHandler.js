// send icCode to compounds and then lookupd in lccs
// need a route fromIdCode
import OCL from 'openchemlib';

import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../../utils/getNoStereosFromCache.js';

const debug = debugLibrary('fromIDCode');

/**
 * Searches the compounds collection for a single idCode (or noStereoTautomerID) and joins the matching lccs data.
 * @param request - Fastify request; query may contain idCode, noStereoTautomerID, stereo (when false, resolves the noStereoTautomerID via cache), limit (max results, clamped to 1..1e4), fields (comma-separated compounds projection) and lccsFields (comma-separated lccs projection).
 * @returns Object with a `data` array of matching compounds (each with joined `lccsData`), or an `errors` array on failure.
 */
export async function fromIDCodeHandler(request) {
  let {
    idCode = '',
    noStereoTautomerID = '',
    limit = 1e3,
    stereo = true,
    fields = 'data.em,data.mf,data.total,data.atom,data.unsaturation',
    lccsFields = 'data',
  } = request.query;

  let connection;
  try {
    if (limit > 1e4) limit = 1e4;
    if (limit < 1) limit = 1;
    let mongoQuery = {};
    if (idCode !== '') {
      if (stereo && noStereoTautomerID === '') {
        mongoQuery = {
          'data.ocl.idCode': idCode,
        };
      } else if (noStereoTautomerID === '' && !stereo) {
        const molecule = OCL.Molecule.fromIDCode(idCode);
        let stereoCache = await getNoStereosFromCache(
          molecule,
          connection,
          'compounds',
        );
        mongoQuery = {
          'data.ocl.noStereoTautomerID': stereoCache?.noStereoTautomerID,
        };
      }
    } else if (noStereoTautomerID !== '') {
      mongoQuery = {
        'data.ocl.noStereoTautomerID': noStereoTautomerID,
      };
    } else {
      throw new Error('idCode or noStereoTautomerID must be provided');
    }
    let fieldsCollection = getFields(fields);
    fieldsCollection = getFieldsWithLookUp(
      'lccsData',
      fieldsCollection,
      lccsFields,
    );
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('compounds');

    const results = await collection
      .aggregate([
        { $match: mongoQuery },
        { $limit: Number(limit) },
        {
          $lookup: {
            from: 'lccs',
            localField: '_id',
            foreignField: '_id',
            as: 'lccsData',
          },
        },
        {
          $unwind: {
            path: '$lccsData',
            preserveNullAndEmptyArrays: true, // Keeps the document even if no match is found
          },
        },
        {
          $project: fieldsCollection,
        },
      ])
      .toArray();
    return { data: results };
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'compounds',
        connection,
        stack: error.stack,
      });
    }
    return { errors: [{ title: error.message, detail: error.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}

/**
 * Adds lookup fields to a projection object, prefixing each with the lookup variable name.
 * @param lookupVariable - Name of the joined field (e.g. 'lccsData') used as the projection prefix.
 * @param fields - Existing projection object to extend.
 * @param lookupFields - Comma-separated field names to include from the looked-up document.
 * @returns The projection object extended with the prefixed lookup fields.
 */
function getFieldsWithLookUp(lookupVariable, fields, lookupFields) {
  for (let field of lookupFields.split(',').filter(Boolean)) {
    fields[`${lookupVariable}.${field}`] = 1;
  }
  return fields;
}
