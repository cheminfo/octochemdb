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
          const sortedFiles = files.sort((a, b) => {
            if (regex.test(a) && !regex.test(b)) {
              return 1;
            }
            if (!regex.test(a) && regex.test(b)) {
              return -1;
            }
            return 0;
          });
          console.log(sortedFiles);

          return sortedFiles;
        }
      },
    },
  },
});
