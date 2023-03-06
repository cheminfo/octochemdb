import { defineConfig } from 'vitest/config';
import { BaseSequencer } from 'vitest/node';

export default defineConfig({
  test: {
    sequence: {
      sequencer: class Seqencer extends BaseSequencer {
        async shard(files) {
          return files;
        }

        async sort(files) {
          // sort by putting files with regex /aggregage/ at the end
          const regex = /aggregate/i;
          const regexCompounds = /syncCompounds/i;
          const regexTaxonomies = /syncTaxonomies/i;
          const regexBioassays = /syncBioassays/i;
          const regexActiveAgainst = /aggregageActiveAgainst/i;
          const sortedFiles = files.sort((a, b) => {
            if (regex.test(a) && !regex.test(b)) {
              return 1;
            }
            if (!regex.test(a) && regex.test(b)) {
              return -1;
            }

            if (regexCompounds.test(a) && !regexCompounds.test(b)) {
              return -1;
            }
            // regexTaxonomies should be after compounds and bioassays
            if (regexTaxonomies.test(a) && !regexTaxonomies.test(b)) {
              return -1;
            }
            if (regexBioassays.test(a) && !regexBioassays.test(b)) {
              return -1;
            }

            return 0;
          });
          sortedFiles.sort((a, b) => {
            // regexActiveAgainst should be the last (github actions executes one by one)
            if (regexActiveAgainst.test(a) && !regexActiveAgainst.test(b)) {
              return 1;
            }
            if (!regexActiveAgainst.test(a) && regexActiveAgainst.test(b)) {
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
