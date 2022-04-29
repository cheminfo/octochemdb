import { searchTaxonomies } from '../utils/searchTaxonomies.js';

export async function getTaxonomiesForLotuses(entry, taxonomiesCollection) {
  let taxonomiesLotuses = [];
  if (entry.data?.taxonomies?.ncbi) {
    if (entry.data.taxonomies.ncbi.length > 1) {
      for (let i = 0; i < entry.data.taxonomies.ncbi.length; i++) {
        let searchParameter = {
          _id: Number(entry.data.taxonomies.ncbi[i].organismID),
        };
        let result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          let finalTaxonomy = result[0].taxonomies;
          finalTaxonomy.species = result[0].organism;
          finalTaxonomy.ref = entry._id;
          taxonomiesLotuses.push(finalTaxonomy);
        }
      }
    } else {
      let searchParameter = {
        _id: Number(entry.data.taxonomies.ncbi[0].organismID),
      };
      let result = await searchTaxonomies(
        taxonomiesCollection,
        searchParameter,
      );
      if (result.length > 0) {
        let finalTaxonomy = result[0].taxonomies;
        finalTaxonomy.species = result[0].organism;
        finalTaxonomy.ref = entry._id;
        taxonomiesLotuses.push(finalTaxonomy);
      }
    }
  } else {
    let alternativeSource = Object.keys(entry.data?.taxonomies);
    if (alternativeSource.length > 0) {
      let sourceToBeUsed = alternativeSource[0].toString();
      if (entry.data.taxonomies[sourceToBeUsed].length > 1) {
        for (let i = 0; i < entry.data.taxonomies[sourceToBeUsed].length; i++) {
          let searchParameter = {
            'taxonomies.genus': entry.data.taxonomies[sourceToBeUsed][i].genus,
          };
          let resultByGenus = await searchTaxonomies(
            taxonomiesCollection,
            searchParameter,
          );
          if (resultByGenus.length > 0) {
            let finalTaxonomy = resultByGenus[0].taxonomies;
            if (entry.data.taxonomies[sourceToBeUsed][i].species) {
              finalTaxonomy.species =
                entry.data.taxonomies[sourceToBeUsed][i].species;
            }
            finalTaxonomy.ref = entry._id;
            taxonomiesLotuses.push(finalTaxonomy);
          }
          if (resultByGenus.length === 0) {
            let searchParameterForFamily = {
              'taxonomies.family':
                entry.data.taxonomies[sourceToBeUsed][0].family,
            };
            let resultByFamily = await searchTaxonomies(
              taxonomiesCollection,
              searchParameterForFamily,
            );
            if (resultByFamily.length > 0) {
              let finalTaxonomyByFamily = resultByFamily[0].taxonomies;
              if (entry.data.taxonomies[sourceToBeUsed][i].genus) {
                finalTaxonomyByFamily.genus =
                  entry.data.taxonomies[sourceToBeUsed][i].genus;
              }
              if (entry.data.taxonomies[sourceToBeUsed][i].species) {
                finalTaxonomyByFamily.species =
                  entry.data.taxonomies[sourceToBeUsed][i].species;
              }
              finalTaxonomyByFamily.ref = entry._id;
              taxonomiesLotuses.push(finalTaxonomyByFamily);
            }
            if (resultByFamily.length === 0) {
              let finalTaxonomy = entry.data.taxonomies[sourceToBeUsed][i];
              delete finalTaxonomy.organismID;
              finalTaxonomy.ref = entry._id;
              taxonomiesLotuses.push(finalTaxonomy);
            }
          }
        }
      } else {
        let searchParameter = {
          'taxonomies.genus': entry.data.taxonomies[sourceToBeUsed][0].genus,
        };
        let resultByGenus = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (resultByGenus.length > 0) {
          let finalTaxonomy = resultByGenus[0].taxonomies;
          finalTaxonomy.species =
            entry.data.taxonomies[sourceToBeUsed][0].species;
          taxonomiesLotuses.push(finalTaxonomy);
        }
        if (resultByGenus.length === 0) {
          let searchParameterForFamily = {
            'taxonomies.family':
              entry.data.taxonomies[sourceToBeUsed][0].family,
          };
          let resultByFamily = await searchTaxonomies(
            taxonomiesCollection,
            searchParameterForFamily,
          );
          if (resultByFamily.length > 0) {
            let finalTaxonomyByFamily = resultByFamily[0].taxonomies;
            if (entry.data.taxonomies[sourceToBeUsed][0].genus) {
              finalTaxonomyByFamily.genus =
                entry.data.taxonomies[sourceToBeUsed][0].genus;
            }
            if (entry.data.taxonomies[sourceToBeUsed][0].species) {
              finalTaxonomyByFamily.species =
                entry.data.taxonomies[sourceToBeUsed][0].species;
            }
            taxonomiesLotuses.push(finalTaxonomyByFamily);
          }
          if (resultByFamily.length === 0) {
            let finalTaxonomy = entry.data.taxonomies[sourceToBeUsed][0];
            delete finalTaxonomy.organismID;
            taxonomiesLotuses.push(finalTaxonomy);
          }
        }
      }
    }
  }
  if (taxonomiesLotuses.length > 0) {
    entry.data.taxonomies = taxonomiesLotuses;
  }
  return entry;
}
