import moleculesFromEM from '../../moleculesFromEM.js';

test('moleculeByEm.js', async () => {
  await expect(moleculesFromEM()).rejects.toStrictEqual(
    new Error('em parameter must be specified'),
  );
});
