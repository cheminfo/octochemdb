import Debug from '../../../../utils/Debug.js';

const debug = Debug('insertNoStereoIDsAndTaxonomies');

export async function getNoStereoIDandTaxonomies(
  entry,
  taxonomiesCollection,
  compoundsCollection,
) {
  try {
    const cid = entry.data.cid;
    let compound = await compoundsCollection.findOne({ _id: Number(cid) });
    let taxonomies = [];
    if (entry.data.activeAgainsTaxIDs) {
      for (let i = 0; i < entry.data.activeAgainsTaxIDs.length; i++) {
        let foundTaxonomies = await taxonomiesCollection.findOne({
          _id: Number(entry.data.activeAgainsTaxIDs[i]),
        });
        if (foundTaxonomies) {
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
        coordinates: compound.data.ocl.coordinates,
        activeAgainstTaxonomy: taxonomies,
      };
    } else {
      result = {
        noStereoID: noStereoID,
        id: compound.data.ocl.id,
        coordinates: compound.data.ocl.coordinates,
      };
    }
    return result;
  } catch (e) {
    debug(e);
  }
}
