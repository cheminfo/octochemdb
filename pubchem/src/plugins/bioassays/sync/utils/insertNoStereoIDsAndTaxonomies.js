import Debug from '../../../../utils/Debug.js';

const debug = Debug('insertNoStereoIDsAndTaxonomies');

/**
 * @name insertNoStereoIDsAndTaxonomies
 * @param {*} connection
 * @returns number of updated documents
 */
export async function insertNoStereoIDsAndTaxonomies(connection) {
  try {
    let counter = 0;
    let start = Date.now();
    // Get collections taxonomies, bioassays and compounds
    const taxonomiesCollection = await connection.getCollection('taxonomies');
    const bioassaysCollection = await connection.getCollection('bioassays');
    const compoundsCollection = await connection.getCollection('compounds');
    // Get count entries in collection bioassays to debug
    let totalEntriesToUpdate = await bioassaysCollection.count();
    // Get cursor whit all entries of bioassays collection
    let bioassayEntries = await bioassaysCollection
      .find({}, { _id: 1 })
      .map((item) => {
        return item;
      });
    // While loop to parse each entry using cursor bioassayEntries
    while (await bioassayEntries.hasNext()) {
      // Get compound CID and search on compounds collection the corresponding entry
      const documentBioassay = await bioassayEntries.next();
      let cid = documentBioassay.data.cid;
      let compound = await compoundsCollection.findOne({ _id: Number(cid) });
      if (compound) {
        // Get standerized taxonomies of target organism from taxonomies collection
        let taxonomies = [];
        if (documentBioassay.data.activeAgainsTaxIDs) {
          for (
            let i = 0;
            i < documentBioassay.data.activeAgainsTaxIDs.length;
            i++
          ) {
            let foundTaxonomies = await taxonomiesCollection.findOne({
              _id: Number(documentBioassay.data.activeAgainsTaxIDs[i]),
            });
            if (foundTaxonomies) {
              taxonomies.push(foundTaxonomies.data);
            }
          }
        }
        // Get noStereoID of current CID
        let noStereoID = compound.data.ocl.noStereoID;
        // Degine the set to be used while updating the collection (taxonomies is not always defined)
        let set;
        if (taxonomies.length > 0) {
          set = {
            'data.ocl.noStereoID': noStereoID,
            'data.ocl.id': compound.data.ocl.id,
            'data.ocl.coordinates': compound.data.ocl.coordinates,
            'data.activeAgainstTaxonomy': taxonomies,
          };
        } else {
          set = {
            'data.ocl.noStereoID': noStereoID,
          };
        }
        await bioassaysCollection.updateOne(
          { _id: documentBioassay._id },
          {
            $set: set,
          },
          { upsert: true },
        );
        // Debug progresses made each 10s or time defined in process env
        if (
          Date.now() - start >
          Number(process.env.DEBUG_THROTTLING || 10000)
        ) {
          let percentage =
            Math.round((counter / totalEntriesToUpdate) * 1000) / 10;
          debug(
            `Processing: imported: ${counter} of ${totalEntriesToUpdate} ---> ${percentage} %`,
          );
          start = Date.now();
        }
        counter++;
      }
    }
    return counter;
  } catch (e) {
    // If error is chatched, debug it on telegram
    const optionsDebug = { collection: 'bioassays', connection };
    debug(e, optionsDebug);
  }
}
