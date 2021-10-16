import moleculesFromEm from '../moleculesFromMf.js';

test('moleculeByMf.js', async () => {
  await expect(moleculesFromEm()).rejects.toStrictEqual(
    new Error('mf parameter must be specified'),
  );
});
