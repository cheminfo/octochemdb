import Debug from '../../../../utils/Debug.js';

const debug = Debug('getTaxonomiesInfo');

export default function getTaxonomiesInfo(data, connection) {
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
      try {
        taxons = taxons.filter(
          (elem, index, self) =>
            self.findIndex((taxonomy) => {
              return taxonomy?.species === elem.species;
            }) === index,
        );
      } catch (e) {
        const optionsDebug = { collection: 'activesOrNaturals', connection };
        debug(e, optionsDebug);
      }
    }

    return taxons;
  } catch (e) {
    const optionsDebug = { collection: 'activesOrNaturals', connection };
    debug(e, optionsDebug);
  }
}
