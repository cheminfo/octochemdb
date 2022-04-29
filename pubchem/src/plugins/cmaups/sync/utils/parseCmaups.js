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
      if (!speciesPaired[pair[1]]) {
        speciesPaired[pair[1]] = [];
      }
      speciesPaired[pair[1]].push(pair[0]);
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

          const orgIDs = speciesPaired[id];

          const taxonomies = [];
          if (orgIDs) {
            if (orgIDs.length > 0) {
              orgIDs.forEach((idOrg) => {
                if (speciesInfo[idOrg]) {
                  taxonomies.push(speciesInfo[idOrg]);
                }
              });
            }
          }

          let finalTaxonomies = [];
          if (taxonomies.length > 0) {
            for (const infos of taxonomies) {
              let taxons = {};
              if (infos?.Species_Tax_ID) {
                taxons.speciesID = infos.Species_Tax_ID;
              }
              if (infos?.Plant_Name) {
                taxons.species = infos?.Plant_Name;
              }
              if (infos?.Genus_Tax_ID) {
                taxons.genusID = infos?.Genus_Tax_ID;
              }
              if (infos?.Genus_Name) {
                taxons.genus = infos?.Genus_Name;
              }

              if (infos?.Family_Tax_ID) {
                taxons.familyID = infos?.Family_Tax_ID;
              }
              if (infos?.Family_Name) {
                taxons.family = infos?.Family_Name;
              }
              if (taxons !== {}) {
                finalTaxonomies.push(taxons);
              }
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
          if (finalTaxonomies.length > 0) {
            result.data.taxonomies = finalTaxonomies;
          }
          if (finalActivities.length > 0) {
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
