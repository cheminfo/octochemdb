import Debug from '../../../utils/Debug.js';

async function getTaxonomyInfo(data) {
  const debug = Debug('getTaxonomyInfo');
  let taxons = [];
  for (const info of data) {
    if (!info._source.includes('lotus')) {
      if (info.data?.taxonomies) {
        for (const taxonomy of info.data.taxonomies) {
          taxonomy.ref = info._source;
          taxons.push(taxonomy);
        }
      }
    } else {
      if (info.data?.taxonomies?.ncbi) {
        for (const taxonomy of info.data.taxonomies.ncbi) {
          taxonomy.ref = info._source;
          taxons.push(taxonomy);
        }
      }
      if (info.data?.taxonomies?.gBifBackboneTaxonomy) {
        for (const taxonomy of info.data.taxonomies.gBifBackboneTaxonomy) {
          taxonomy.ref = info._source;
          taxons.push(taxonomy);
        }
      }
      if (info.data?.taxonomies?.iNaturalist) {
        for (const taxonomy of info.data.taxonomies.iNaturalist) {
          taxonomy.ref = info._source;
          taxons.push(taxonomy);
        }
      }
      if (info.data?.taxonomies?.openTreeOfLife) {
        for (const taxonomy of info.data.taxonomies.openTreeOfLife) {
          taxonomy.ref = info._source;
          taxons.push(taxonomy);
        }
      }
      if (info.data?.taxonomies?.iTIS) {
        for (const taxonomy of info.data.taxonomies.iTIS) {
          taxonomy.ref = info._source;
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
}

export default getTaxonomyInfo;
