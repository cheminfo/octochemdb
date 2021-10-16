

const pubChemConnection = new (require('../PubChemConnection'))();

test('connection to DB', async () => {
  let database = await pubChemConnection.getDatabase();
  expect(database.databaseName).toBe('pubchem');
});
