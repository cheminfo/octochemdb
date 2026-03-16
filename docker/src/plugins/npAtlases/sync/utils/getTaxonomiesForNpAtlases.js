import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';
/**
 * Resolves standardised taxonomy data for an NPAtlas entry by querying the
 * `taxonomies` MongoDB collection.
 *
 * The function attempts to match the entry's taxonomy at progressively
 * broader ranks (species → genusID → genus → family → class → phylum).
 * As soon as a match is found the resolved taxonomy is enriched with any
 * finer-grained fields from the original entry and returned.  If no match
 * is found at any rank, the original taxonomy fields are returned as-is.
 *
 * Deprecated taxonomy IDs are transparently mapped to their current
 * counterparts using the `oldToNewTaxIDs` lookup.
 *
 * @param {NpAtlasEntry} entry - The parsed NPAtlas entry containing raw
 *   taxonomy data in `entry.data.taxonomies[0]`.
 * @param {any} taxonomiesCollection - MongoDB collection handle for
 *   the `taxonomies` collection.
 * @param {DeprecatedTaxIdMap} oldToNewTaxIDs - Deprecated → current
 *   taxonomy-ID mapping from `taxonomySynonyms()`.
 * @returns {Promise<any[]>} Array of standardised taxonomy objects (usually
 *   a single element).
 */
export async function getTaxonomiesForNpAtlases(
  entry,
  taxonomiesCollection,
  oldToNewTaxIDs,
) {
  const taxonomiesResults = [];
  if (entry.data?.taxonomies) {
    // Extract the first (and usually only) taxonomy from the entry
    const taxons = entry.data.taxonomies[0];
    let searchParameter;
    /** @type {NpAtlasTaxonomySearchParams} */
    const type = {};
    const oldIDs = Object.keys(oldToNewTaxIDs);
    // Determine search parameters at each taxonomic rank
    if (taxons.species) {
      searchParameter = {
        'data.species': taxons.species,
      };
      type.species = searchParameter;
    }
    if (taxons.genusID && taxons.genusID !== null) {
      let idToUse = Number(taxons.genusID);
      // Map deprecated taxonomy IDs to their current counterparts
      if (oldIDs.includes(taxons.genusID)) {
        idToUse = Number(oldToNewTaxIDs[taxons.genusID]);
      }
      searchParameter = {
        _id: idToUse,
      };
      type.genusID = searchParameter;
    }

    if (taxons.genus) {
      searchParameter = {
        'data.genus': taxons.genus,
      };
      type.genus = searchParameter;
    }

    if (taxons.family) {
      searchParameter = {
        'data.family': taxons.family,
      };
      type.family = searchParameter;
    }
    if (taxons.class) {
      searchParameter = {
        'data.class': taxons.class,
      };
      type.class = searchParameter;
    }
    if (taxons.phylum) {
      searchParameter = {
        'data.phylum': taxons.phylum,
      };
      type.phylum = searchParameter;
    }
    // Try each rank in order of specificity until a match is found.
    // `shouldSearch` guards against redundant DB queries.
    let shouldSearch = true;

    if (type.species && shouldSearch) {
      const result = await searchTaxonomies(taxonomiesCollection, type.species);
      if (result.length > 0) {
        const finalTaxonomy = result[0].data;

        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
        taxonomiesResults.push(finalTaxonomy);
        shouldSearch = false;
      }
    }
    if (type.genusID && shouldSearch) {
      const result = await searchTaxonomies(taxonomiesCollection, type.genusID);
      if (result.length > 0) {
        const finalTaxonomy = result[0].data;
        if (taxons.species) {
          finalTaxonomy.species = taxons.species;
        }
        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
        taxonomiesResults.push(finalTaxonomy);
        shouldSearch = false;
      }
    }

    if (type.genus && shouldSearch) {
      const result = await searchTaxonomies(taxonomiesCollection, type.genus);
      if (result.length > 0) {
        const finalTaxonomy = result[0].data;
        if (taxons.species) {
          finalTaxonomy.species = taxons.species;
        }
        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
        taxonomiesResults.push(finalTaxonomy);
        shouldSearch = false;
      }
    }

    if (type.family && shouldSearch) {
      const result = await searchTaxonomies(taxonomiesCollection, type.family);
      if (result.length > 0) {
        const finalTaxonomy = result[0].data;
        if (taxons.genus) {
          finalTaxonomy.genus = taxons.genus;
        }
        if (taxons.species) {
          finalTaxonomy.species = taxons.species;
        }
        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
        taxonomiesResults.push(finalTaxonomy);
        shouldSearch = false;
      }
    }

    if (type.class && shouldSearch) {
      const result = await searchTaxonomies(taxonomiesCollection, type.class);
      if (result.length > 0) {
        const finalTaxonomy = result[0].data;
        if (taxons.family) {
          finalTaxonomy.family = taxons.family;
        }
        if (taxons.genus) {
          finalTaxonomy.genus = taxons.genus;
        }
        if (taxons.species) {
          finalTaxonomy.species = taxons.species;
        }
        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
        taxonomiesResults.push(finalTaxonomy);
        shouldSearch = false;
      }
    }
    if (type.phylum && shouldSearch) {
      const result = await searchTaxonomies(taxonomiesCollection, type.phylum);
      if (result.length > 0) {
        const finalTaxonomy = result[0].data;

        if (taxons.class) {
          finalTaxonomy.class = taxons.class;
        }
        if (taxons.family) {
          finalTaxonomy.family = taxons.family;
        }
        if (taxons.genus) {
          finalTaxonomy.genus = taxons.genus;
        }
        if (taxons.species) {
          finalTaxonomy.species = taxons.species;
        }
        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
        taxonomiesResults.push(finalTaxonomy);
        shouldSearch = false;
      }
    }
    // No match found at any rank – keep the original taxonomy in standard format
    if (shouldSearch) {
      /** @type {NpAtlasResolvedTaxonomy} */
      const finalTaxonomy = {};
      if (taxons.kingdom) {
        finalTaxonomy.kingdom = taxons.kingdom;
      }
      if (taxons.phylum) {
        finalTaxonomy.phylum = taxons.phylum;
      }
      if (taxons.class) {
        finalTaxonomy.class = taxons.class;
      }
      if (taxons.family) {
        finalTaxonomy.family = taxons.family;
      }
      if (taxons.genus) {
        finalTaxonomy.genus = taxons.genus;
      }
      if (taxons.species) {
        finalTaxonomy.species = taxons.species;
      }
      finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
      taxonomiesResults.push(finalTaxonomy);
    }
  }

  return taxonomiesResults;
}
