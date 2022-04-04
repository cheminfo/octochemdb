
import CC   from 'chemcalc';
import fs   from 'fs-extra';
import mkdirp   from 'mkdirp'.sync;
import path   from 'path';
import rules   from 'rules';
import Debug from '../../utils/Debug';
const debug=Debug('candidates')
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data/mfs.json'), 'utf8'),
);

for (let i = 2; i < data.length; i++) {
  let dir = path.join(__dirname, `data/range${i}`);
  mkdirp(dir);
  let formulas = data[i].formulas;
  debug(`total: ${formulas.length}`);
  let total = 0;
  for (let j = 0; j < formulas.length; j++) {
    let formula = formulas[j];
    let list = CC.mfFromMonoisotopicMass(formula.em, {
      mfRange: rules.sampleMfRange,
      massRange: (100 * formula.em) / 1e6,
      useUnsaturation: true,
      integerUnsaturation: true,
      minUnsaturation: 0,
      maxUnsaturation: 999,
      maxNumberRows: 1e6,
    });
    let result = {
      mf: formula.mf,
      em: formula.em,
      bruteForceIteration: list.bruteForceIteration,
      realIteration: list.realIteration,
      results: list.results.map((result) => {
        return {
          mf: result.mf,
          em: result.em,
          ppm: Math.abs(result.ppm),
        };
      }),
    };
    fs.writeFileSync(
      path.join(dir, `${formula.mf}.json`),
      JSON.stringify(result),
    );
    total++;
    if (total % 100 === 0) debug(total);
  }
  break;
}
