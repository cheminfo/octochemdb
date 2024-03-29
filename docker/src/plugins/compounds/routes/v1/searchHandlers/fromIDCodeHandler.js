// send icCode to compounds and then lookupd in lccs
// need a route fromIdCode
import OCL from 'openchemlib';

import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../../utils/getNoStereosFromCache.js';

const debug = debugLibrary('fromIDCode');

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
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'compounds',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}

function getFieldsWithLookUp(lookupVariable, fields, lookupFields) {
  for (let field of lookupFields.split(',').filter((field) => field)) {
    fields[`${lookupVariable}.${field}`] = 1;
  }
  return fields;
}
