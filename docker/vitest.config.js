/**
 * Vitest configuration with a custom test sequencer that enforces a specific
 * execution order across sync and aggregation plugin test suites.
 *
 * Sync plugin order (earliest → latest):
 *
 *  1. syncCompounds      – must run first; all other sync plugins rely on
 *                          compound documents being present.
 *  2. syncTaxonomies     – required before bioassays because activity records
 *                          reference taxonomy documents.
 *  3. syncBioassays      – depends on compounds and taxonomies.
 *  4. patents            – patent data must exist before compound-patent
 *                          relationships can be built.
 *  5. compoundPatents    – explicitly ordered after patents.
 *  6. gnps              – must complete before aggregation plugins.
 *  7. (remaining sync)   – no hard ordering constraint between them.
 *
 * Aggregation plugin order:
 *
 *  8. inSilicoFragments  – depends on compounds and spectra collections.
 *  9. aggregate          – all other aggregation jobs run last; they read
 *                          from every populated collection.
 */
import { defineConfig } from 'vitest/config';
import { BaseSequencer } from 'vitest/node';

export default defineConfig({
  test: {
    sequence: {
      sequencer: class Sequencer extends BaseSequencer {
        async shard(files) {
          return files;
        }

        async sort(files) {
          // syncCompoundPatents should be after syncPatents
          const regexCompoundPatents = /compoundPatents/i;
          const regexPatents = /patents/i;
          let sortedFiles = files.sort((a, b) => {
            if (regexCompoundPatents.test(a) && !regexCompoundPatents.test(b)) {
              return 1;
            }
            if (!regexCompoundPatents.test(a) && regexCompoundPatents.test(b)) {
              return -1;
            }
            if (regexPatents.test(a) && !regexPatents.test(b)) {
              return 1;
            }
            if (!regexPatents.test(a) && regexPatents.test(b)) {
              return -1;
            }
            return 0;
          });
          // sort by putting files with regex /aggregage/ at the end
          const regex = /aggregate/i;
          const regexCompounds = /syncCompounds/i;
          const regexOctoChemConnection = /OctoChemConnection/i;
          const regexTaxonomies = /syncTaxonomies/i;
          const regexBioassays = /syncBioassays/i;
          const regexActiveAgainst = /activeAgainst/i;
          const regexInSilicoFragments = /inSilicoFragments/i;
          const regexGnps = /gnps/i;
          const regexMesh = /getMeshTerms.test/i;
          const regexID = /id/i;
          const regexnEntries = /nEntries/i;
          const regexSearch = /search/i;
          const regexFrom = /from/i;
          const regexAdmin = /admin/i;
          const regexInfo = /collections/i;

          sortedFiles = sortedFiles.sort((a, b) => {
            if (regex.test(a) && !regex.test(b)) {
              return 1;
            }
            if (!regex.test(a) && regex.test(b)) {
              return -1;
            }

            if (regexCompounds.test(a) && !regexCompounds.test(b)) {
              return -1;
            }
            // OctoChemConnection should be after compounds
            if (
              regexOctoChemConnection.test(a) &&
              !regexOctoChemConnection.test(b)
            ) {
              return 1;
            }
            // regexTaxonomies should be after compounds and bioassays
            if (regexTaxonomies.test(a) && !regexTaxonomies.test(b)) {
              return -1;
            }

            if (regexBioassays.test(a) && !regexBioassays.test(b)) {
              return -1;
            }

            // gnps should be before aggregation
            if (regexGnps.test(a) && !regexGnps.test(b)) {
              return -1;
            }

            return 0;
          });

          // sort by putting files with regex /aggregateActiveAgainst/ at the end
          sortedFiles = sortedFiles.sort((a, b) => {
            if (regexID.test(a) && !regexID.test(b)) {
              return 1;
            }
            if (regexnEntries.test(a) && !regexnEntries.test(b)) {
              return 1;
            }
            if (!regexID.test(a) && regexID.test(b)) {
              return -1;
            }
            if (regexSearch.test(a) && !regexSearch.test(b)) {
              return 1;
            }
            if (!regexSearch.test(a) && regexSearch.test(b)) {
              return -1;
            }
            if (regexFrom.test(a) && !regexFrom.test(b)) {
              return 1;
            }
            if (!regexFrom.test(a) && regexFrom.test(b)) {
              return -1;
            }
            if (regexAdmin.test(a) && !regexAdmin.test(b)) {
              return 1;
            }
            if (!regexAdmin.test(a) && regexAdmin.test(b)) {
              return -1;
            }
            if (regexInfo.test(a) && !regexInfo.test(b)) {
              return 1;
            }
            if (!regexInfo.test(a) && regexInfo.test(b)) {
              return -1;
            }
            if (regexActiveAgainst.test(a) && !regexActiveAgainst.test(b)) {
              return 1;
            }
            if (!regexActiveAgainst.test(a) && regexActiveAgainst.test(b)) {
              return -1;
            }
            if (
              regexInSilicoFragments.test(a) &&
              !regexInSilicoFragments.test(b)
            ) {
              return 1;
            }
            if (
              !regexInSilicoFragments.test(a) &&
              regexInSilicoFragments.test(b)
            ) {
              return -1;
            }
            if (regexMesh.test(a) && !regexMesh.test(b)) {
              return 1;
            }
            if (!regexMesh.test(a) && regexMesh.test(b)) {
              return -1;
            }
            return 0;
          });
          return sortedFiles;
        }
      },
    },
  },
});
