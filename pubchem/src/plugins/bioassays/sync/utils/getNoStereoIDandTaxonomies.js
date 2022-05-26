import Debug from '../../../../utils/Debug.js';

const debug = Debug('insertNoStereoIDsAndTaxonomies');

export async function getNoStereoIDandTaxonomies(
  entry,
  taxonomiesCollection,
  compoundsCollection,
  synonyms,
) {
  try {
    let oldIDs = Object.keys(synonyms);
    const cid = entry.data.cid;
    let compound = await compoundsCollection.findOne({ _id: cid });
    if (compound) {
      let taxonomies = [];
      if (entry.data.activeAgainstTaxIDs) {
        for (let i = 0; i < entry.data.activeAgainstTaxIDs.length; i++) {
          let idToUse = Number(entry.data.activeAgainstTaxIDs[i]);
          if (oldIDs.includes(entry.data.activeAgainstTaxIDs[i])) {
            idToUse = Number(synonyms[entry.data.activeAgainstTaxIDs[i]]);
          }
          let foundTaxonomies = await taxonomiesCollection.findOne({
            _id: idToUse,
          });
          if (foundTaxonomies) {
            foundTaxonomies.data.dbRef = {
              $ref: taxonomies,
              $id: foundTaxonomies._id,
            };
            taxonomies.push(foundTaxonomies.data);
          }
        }
      }

      let noStereoID = compound.data.ocl.noStereoID;
      let result;
      if (taxonomies.length > 0) {
        result = {
          noStereoID: noStereoID,
          id: compound.data.ocl.id,
          targetTaxonomies: taxonomies,
        };
      } else {
        result = {
          noStereoID: noStereoID,
          id: compound.data.ocl.id,
        };
      }
      return result;
    }
  } catch (e) {
    debug(e);
  }
}
