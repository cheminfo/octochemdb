import moleculesFromEm from '../moleculesFromEm.js';

test('moleculeByEm.js', async () => {
  await expect(moleculesFromEm()).rejects.toStrictEqual(
    new Error('em parameter must be specified'),
  );
});
