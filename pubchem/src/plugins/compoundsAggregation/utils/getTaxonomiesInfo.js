import Debug from '../../../utils/Debug.js';

async function getTaxonomiesInfo(data, connection) {
  const debug = Debug('getTaxonomiesInfo');
  try {
    let taxons = [];
    for (const info of data) {
      if (!info._id.includes('LTS')) {
        if (info.data?.taxonomies) {
          for (const taxonomy of info.data.taxonomies) {
            taxonomy.ref = info._id;
            taxons.push(taxonomy);
          }
        }
      } else {
        if (info.data?.taxonomies?.ncbi) {
          for (const taxonomy of info.data.taxonomies.ncbi) {
            taxonomy.ref = info._id;
            taxons.push(taxonomy);
          }
        }
        if (info.data?.taxonomies?.gBifBackboneTaxonomy) {
          for (const taxonomy of info.data.taxonomies.gBifBackboneTaxonomy) {
            taxonomy.ref = info._id;
            taxons.push(taxonomy);
          }
        }
        if (info.data?.taxonomies?.iNaturalist) {
          for (const taxonomy of info.data.taxonomies.iNaturalist) {
            taxonomy.ref = info._id;
            taxons.push(taxonomy);
          }
        }
        if (info.data?.taxonomies?.openTreeOfLife) {
          for (const taxonomy of info.data.taxonomies.openTreeOfLife) {
            taxonomy.ref = info._id;
            taxons.push(taxonomy);
          }
        }
        if (info.data?.taxonomies?.iTIS) {
          for (const taxonomy of info.data.taxonomies.iTIS) {
            taxonomy.ref = info._id;
            taxons.push(taxonomy);
          }
        }
      }
    }
    if (taxons.length > 0) {
      try {
        taxons = taxons.filter(
          (elem, index, self) =>
            self.findIndex((taxonomy) => {
              return taxonomy.species === elem.species;
            }) === index,
        );
      } catch (e) {
        debug(e.stack);
      }
    }
    return taxons;
  } catch (e) {
    const optionsDebug = { collection: 'bestOfCompounds', connection };
    debug(e, optionsDebug);
  }
}

export default getTaxonomiesInfo;
