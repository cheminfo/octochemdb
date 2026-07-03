// send icCode to compounds and then lookupd in lccs
// need a route fromIdCode
import OCL from 'openchemlib';

import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../../utils/getNoStereosFromCache.js';

const debug = debugLibrary('fromIDCodes');

/**
 * Searches the compounds collection for multiple idCodes (or noStereoTautomerIDs) and joins the matching lccs data.
 * @param request - Fastify request; query may contain idCodes, noStereoTautomerIDs, stereo (when false, resolves noStereoTautomerIDs via cache), limit (max results, clamped to 1..1e4), fields (comma-separated compounds projection) and lccsFields (comma-separated lccs projection). Lists are split on spaces, commas, semicolons or whitespace.
 * @returns Object with a `data` array of matching compounds (each with joined `lccsData`), or an `errors` array on failure.
 */
export async function fromIDCodesHandler(request) {
  let {
    idCodes = '',
    noStereoTautomerIDs = '',
    limit = 1e3,
    stereo = true,
    fields = 'data.em,data.mf,data.total,data.atom,data.unsaturation',
    lccsFields = 'data',
  } = request.query;

  let connection;
  try {
    if (limit > 1e4) limit = 1e4;
    if (limit < 1) limit = 1;

    let matchParameters = {};

    if (idCodes !== '') {
      if (stereo && noStereoTautomerIDs === '') {
        matchParameters['data.ocl.idCode'] = {
          $in: idCodes.split(/[ ,;\t\r\n]+/).filter(Boolean),
        };
      } else if (noStereoTautomerIDs === '' && !stereo) {
        let noStereoTautomerIDsToProcess = {};
        let idCodesToProcess = idCodes.split(/[ ,;\t\r\n]+/).filter(Boolean);
        for (let idCode of idCodesToProcess) {
          const molecule = OCL.Molecule.fromIDCode(idCode);
          let stereoCache = await getNoStereosFromCache(
            molecule,
            connection,
            'compounds',
          ); //
          if (stereoCache?.noStereoTautomerID) {
            noStereoTautomerIDsToProcess[stereoCache?.noStereoTautomerID] =
              true;
          }
        }
        matchParameters['data.ocl.noStereoTautomerID'] = {
          $in: Object.keys(noStereoTautomerIDsToProcess),
        };
      }
    } else if (noStereoTautomerIDs !== '') {
      matchParameters['data.ocl.noStereoTautomerID'] = {
        $in: noStereoTautomerIDs.split(/[ ,;\t\r\n]+/).filter(Boolean),
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
        { $match: matchParameters },
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
