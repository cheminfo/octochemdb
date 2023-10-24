import debugLibrary from '../../../utils/Debug.js';

import parseCompoundInfo from './parseCompoundInfo.js';

const debug = debugLibrary('getCompoundsInfo');
/**
 * @description Get compounds information compounds collection and data array
 * @param {*} entry Entry from the aggregation process
 * @param {*} data Array of all data for the current noStereoID
 * @param {*} compoundsCollection Compounds collection
 * @param {*} noStereoTautomerID current noStereoTautomerID
 * @param {*} connection OctoChem connection
 * @returns {Promise} Returns the entry with the compounds information
 */
export default async function getCompoundsInfo(
  entry,
  data,
  compoundsCollection,
  noStereoTautomerID,
  connection,
  compoundPatentsCollection,
) {
  //getCompoundsInfo Cannot read properties of null (reading 'data')
  try {
    let cursor = await compoundsCollection.find({
      'data.ocl.noStereoTautomerID': noStereoTautomerID,
    });
    let compoundInfo;
    while ((await cursor.hasNext()) && compoundInfo === undefined) {
      let doc = await cursor.next();
      if (doc.data.ocl.noStereoTautomerID !== undefined) {
        compoundInfo = doc;
      }
    }

    const parsedCompoundInfo = await parseCompoundInfo(
      compoundInfo,
      noStereoTautomerID,
      connection,
      entry,
      data,
    );
    const casNumber = parsedCompoundInfo.casNumbers;
    const pmids = parsedCompoundInfo.pmids;
    const meshTerms = parsedCompoundInfo.meshTerms;
    entry = parsedCompoundInfo.entry;
    const compoundsIDs = parsedCompoundInfo.compoundsIds;
    const dbRefsCompounds = parsedCompoundInfo.cidsDBRef;
    const dbRefsMolecules = parsedCompoundInfo.dbRefsMolecules;
    let titles = parsedCompoundInfo.titles;
    let compoundsPatents = [];
    // let bioassaysPubChemDBRefs = [];
    // const bioassaysPubChemCollection =
    //await connection.getCollection('bioassaysPubChem');
    if (compoundsIDs?.length > 0) {
      for (let compound of compoundsIDs) {
        let currentCid = Number(compound);
        // NOT YET IMPLEMENTED
        /*
        // get bioassaysPubChem dbRefs
        let bioassaysPubChemRef = await getBioassaysPubChemRefs(
          currentCid,
          bioassaysPubChemCollection,
        );
        // merge bioassaysPubChem dbRefs
        bioassaysPubChemDBRefs = [
          ...bioassaysPubChemDBRefs,
          ...bioassaysPubChemRef,
        ];
        */
        let cursor = await compoundPatentsCollection.find({ _id: currentCid });
        if (await cursor.hasNext()) {
          let patent = await cursor.next();
          if (patent?.data?.patents?.length > 0) {
            for (let patentID of patent.data.patents) {
              if (!compoundsPatents.includes(patentID)) {
                compoundsPatents.push(patentID);
              }
            }
          }
        }
      }
    }
    entry.data.nbPatents = 0;
    entry.data.nbPatents = compoundsPatents?.length;

    if (compoundsPatents?.length > 0) {
      let dbRefsPatents = [];
      let patentsCollection = await connection.getCollection('patents');
      for (let patent of compoundsPatents) {
        let patentCursor = await patentsCollection.find({ _id: patent });
        let patentInfo = await patentCursor.next();
        if (patentInfo !== null) {
          dbRefsPatents.push({ $ref: 'patents', $id: patentInfo._id });
        }
      }

      entry.data.patents = dbRefsPatents;
    }
    /*   if (bioassaysPubChemDBRefs.length > 0) {
      entry.data.bioassaysPubChem = bioassaysPubChemDBRefs;
    }*/
    if (titles?.length > 0) {
      titles.sort((a, b) => {
        // Check if a and b have parentheses or numbers
        const aHasParenthesesOrNumbers = /[()\d]/.test(a);
        const bHasParenthesesOrNumbers = /[()\d]/.test(b);

        if (!aHasParenthesesOrNumbers && !bHasParenthesesOrNumbers) {
          // If both a and b have no parentheses or numbers, sort by length
          return a?.length - b?.length;
        } else if (!aHasParenthesesOrNumbers) {
          // If only a has no parentheses or numbers, sort it first
          return -1;
        } else if (!bHasParenthesesOrNumbers) {
          // If only b has no parentheses or numbers, sort it first
          return 1;
        } else {
          // If both a and b have parentheses or numbers, sort the one with parentheses first
          if (aHasParenthesesOrNumbers && bHasParenthesesOrNumbers) {
            const aHasParentheses = /[()]/.test(a);
            const bHasParentheses = /[()]/.test(b);

            if (aHasParentheses && !bHasParentheses) {
              // If only a has parentheses, sort it first
              return -1;
            } else if (!aHasParentheses && bHasParentheses) {
              // If only b has parentheses, sort it first
              return 1;
            } else if (aHasParentheses && bHasParentheses) {
              // If both a and b have parentheses, sort by length
              return a?.length - b?.length;
            }
          }
          // If both a and b have no parentheses, sort by length
          if (a?.length !== b?.length) {
            return a?.length - b?.length;
          } else {
            // If both a and b have the same length, sort alphabetically
            return 0;
          }
        }
      });
      entry.data.titles = titles;
    }
    entry.data.nbMolecules = 0;
    if (dbRefsMolecules?.length > 0) {
      entry.data.molecules = dbRefsMolecules;
      entry.data.nbMolecules = dbRefsMolecules?.length;
    }
    if (dbRefsCompounds?.length > 0) {
      entry.data.compounds = dbRefsCompounds;
    }
    if (casNumber?.length > 0) {
      entry.data.cas = casNumber;
    }
    if (pmids?.length > 0) {
      entry.data.pmids = pmids;
    }
    if (meshTerms?.length > 0) {
      entry.data.meshTerms = meshTerms;
    }
    return entry;
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
/*
async function getBioassaysPubChemRefs(cid, collection) {
  // find in collection cid inside array named associatedCids need to unwind the array for the match to work
  let cursor = await collection.find({
    $and: [{ 'data.associatedCIDs': { $elemMatch: { $eq: cid } } }],
  });
  let bioassaysPubChemRef = [];
  while (await cursor.hasNext()) {
    let doc = await cursor.next();
    if (doc !== undefined) {
      bioassaysPubChemRef.push({ $ref: 'bioassaysPubChem', $id: doc._id });
    }
  }
  return bioassaysPubChemRef;
}*/
