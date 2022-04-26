import OCL from 'openchemlib';

import Debug from '../../../../utils/Debug.js';

const debug = Debug('parseCmaups');

export async function* parseCmaups(
  general,
  activities,
  speciesPair,
  speciesInfo,
  parseSkip,
  connection,
) {
  try {
    const speciesPaired = {};

    for (const pair of speciesPair) {
      speciesPaired[pair[1]] = pair[0];
    }
    let errorsCounter = 0;
    let skipping = true;
    for await (const item of general) {
      if (skipping && parseSkip !== undefined) {
        if (parseSkip === item.Ingredient_ID) {
          skipping = false;
          debug(`Skipping compound till:${item.Ingredient_ID}`);
        }
        continue;
      }
      try {
        if (Object.keys(item.Ingredient_ID).length > 0) {
          const id = item.Ingredient_ID;
          const activity = activities[id];
          const finalActivities = [];
          if (activity !== undefined) {
            for (const info of activity) {
              finalActivities.push({
                activityType: info?.Activity_Type,
                activityValue: info?.Activity_Value,
                activityUnit: info?.Activity_Unit,
                refIdType: info?.Reference_ID_Type,
                refId: info?.Reference_ID,
              });
            }
          }
          const smilesDb = item.__parsed_extra.slice(-1)[0];
          let oclID;
          let noStereoID;
          try {
            const oclMolecule = OCL.Molecule.fromSmiles(smilesDb);

            oclID = oclMolecule.getIDCodeAndCoordinates();

            oclMolecule.stripStereoInformation();
            noStereoID = oclMolecule.getIDCode();
          } catch (e) {
            if (
              e.message ===
              'Class$S16: Assignment of aromatic double bonds failed'
            ) {
              errorsCounter++;
            } else debug(e.stack);

            continue;
          }
          const orgID = speciesPaired[id];
          const taxonomies = speciesInfo[orgID];
          let finalTaxonomies = [];
          if (taxonomies !== undefined) {
            let taxons = {};
            if (taxonomies?.Species_Tax_ID) {
              taxons.speciesID;
            }
            if (taxonomies?.Plant_Name) {
              taxons.species = taxonomies?.Plant_Name;
            }
            if (taxonomies?.Genus_Tax_ID) {
              taxons.genusID = taxonomies?.Genus_Tax_ID;
            }
            if (taxonomies?.Genus_Name) {
              taxons.genus = taxonomies?.Genus_Name;
            }

            if (taxonomies?.Family_Tax_ID) {
              taxons.familyID = taxonomies?.Family_Tax_ID;
            }
            if (taxonomies?.Family_Name) {
              taxons.family = taxonomies?.Family_Name;
            }
            if (taxons !== {}) {
              finalTaxonomies.push(taxons);
            }
          }
          const result = {
            _id: item.Ingredient_ID,
            data: {
              ocl: {
                id: oclID.idCode,
                coordinates: oclID.coordinates,
                noStereoID: noStereoID,
              },
            },
          };
          if (item.pubchem_cid) result.data.cid = item.pubchem_cid;
          if (finalTaxonomies.length !== 0) {
            result.data.taxonomies = finalTaxonomies;
          }
          if (finalActivities.length !== 0) {
            result.data.activities = finalActivities;
          }
          yield result;
        }
      } catch (e) {
        continue;
      }
    }
    debug(
      `Class$S16: Assignment of aromatic double bonds failed --> count: ${errorsCounter}`,
    );
  } catch (e) {
    const optionsDebug = { collection: 'cmaups', connection };
    debug(e, optionsDebug);
  }
}
