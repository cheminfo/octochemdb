import moleculesFromEM from '../moleculesFromMf.js';

test('moleculeByMf.js', async () => {
  await expect(moleculesFromEM()).rejects.toStrictEqual(
    new Error('mf parameter must be specified'),
  );
});
