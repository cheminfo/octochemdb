import Debug from '../../../utils/Debug.js';

async function getTaxonomiesInfo(data, connection) {
  const debug = Debug('getTaxonomiesInfo');
  try {
    let taxons = [];
    for (const entry of data) {
      if (entry.data?.taxonomies) {
        for (let taxonomy of entry.data.taxonomies) {
          taxons.push(taxonomy);
        }
      }
    }
    if (taxons.length > 0) {
      let originalLength = taxons.length;
      try {
        taxons = taxons.filter(
          (elem, index, self) =>
            self.findIndex((taxonomy) => {
              return taxonomy?.species === elem.species;
            }) === index,
        );
        //  debug(`${originalLength}----${taxons.length}`);
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
