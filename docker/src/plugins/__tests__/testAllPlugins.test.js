import { PubChemConnection } from '../../utils/PubChemConnection.js';
import { aggregate as aggregateActiveAgainst } from '../activeAgainst/aggregates/aggregateActiveAgainst.js';
import { aggregate as aggregateActivesOrNaturals } from '../activesOrNaturals/aggregates/aggregateActivesOrNaturals.js';
import { sync as syncBioassays } from '../bioassays/sync/syncBioassays.js';
import { sync as syncCmaups } from '../cmaups/sync/syncCmaups.js';
import { sync as syncCoconuts } from '../coconuts/sync/syncCoconuts.js';
import { sync as syncCompounds } from '../compounds/sync/syncCompounds.js';
import { sync as syncGNPS } from '../gnps/sync/syncGNPS.js';
import { sync as syncLotuses } from '../lotuses/sync/syncLotuses.js';
import { aggregate as aggregateCHNOSClF } from '../mfs/aggregates/aggregateCHNOSClF.js';
import { aggregate as aggregateCommonMFs } from '../mfs/aggregates/aggregateCommonMFs.js';
import { aggregate as aggregateMFs } from '../mfs/aggregates/aggregateMFs.js';
import { sync as syncNpatlases } from '../npAtlases/sync/syncNpatlases.js';
import { sync as syncNpasses } from '../npasses/sync/syncNpasses.js';
import { sync as syncPatents } from '../patents/sync/syncPatents.js';
import { sync as syncPubmeds } from '../pubmeds/sync/syncPubmed.js';
import { sync as syncSubstances } from '../substances/sync/syncSubstances.js';
import { sync as syncTaxonomies } from '../taxonomies/sync/syncTaxonomies.js';

describe('test All Plugins', () => {
  it('syncTaxonomies', async () => {
    const connection = new PubChemConnection();
    await syncTaxonomies(connection);
    const collection = await connection.getCollection('taxonomies');
    const collectionEntry = await collection.find({ _id: 2841640 }).limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('syncCompounds First Importation', async () => {
    const connection = new PubChemConnection();
    await syncCompounds(connection);
    const collection = await connection.getCollection('compounds');
    const collectionEntry = await collection.find({ _id: 59478 }).limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('syncCompounds Incremental Importation', async () => {
    const connection = new PubChemConnection();
    const collection = await connection.getCollection('compounds');
    const collectionEntryIncremental = await collection
      .find({ _id: 160056959 })
      .limit(1);
    const resultIncremental = await collectionEntryIncremental.next();
    if (resultIncremental?._seq) {
      delete resultIncremental._seq;
    }
    expect(resultIncremental).toMatchSnapshot();
    await connection.close();
  });
  it('syncSubstances First Importation', async () => {
    const connection = new PubChemConnection();
    await syncSubstances(connection);
    const collection = await connection.getCollection('substances');
    const collectionEntry = await collection.find({ _id: 56427212 }).limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('syncSubstances Incremental Importation', async () => {
    const connection = new PubChemConnection();
    const collection = await connection.getCollection('substances');
    const collectionEntryIncremental = await collection
      .find({ _id: 56435292 })
      .limit(1);
    const resultIncremental = await collectionEntryIncremental.next();
    if (resultIncremental?._seq) {
      delete resultIncremental._seq;
    }
    expect(resultIncremental).toMatchSnapshot();
    await connection.close();
  });
  it('syncBioassays', async () => {
    const connection = new PubChemConnection();
    await syncBioassays(connection);
    const collection = await connection.getCollection('bioassays');
    const collectionEntry = await collection.find({ _id: '59478_1' }).limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('syncCmaups', async () => {
    const connection = new PubChemConnection();
    await syncCmaups(connection);
    const collection = await connection.getCollection('cmaups');
    const collectionEntry = await collection
      .find({ _id: 'NPC146355' })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('syncCoconuts', async () => {
    const connection = new PubChemConnection();
    await syncCoconuts(connection);
    const collection = await connection.getCollection('coconuts');
    const collectionEntry = await collection
      .find({ _id: 'CNP0330764' })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('syncGNPS', async () => {
    const connection = new PubChemConnection();
    await syncGNPS(connection);
    const collection = await connection.getCollection('gnps');
    const collectionEntry = await collection
      .find({ _id: 'CCMSLIB00000001547' })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    const emptySmilesEntry = await collection
      .find({ _id: 'CCMSLIB00000001548' })
      .limit(1);
    const emptySmiles = await emptySmilesEntry.next();
    // expect(bronzeSpectrum) to be null
    expect(emptySmiles).toBeNull();
    await connection.close();
  });
  it('syncLotuses', async () => {
    const connection = new PubChemConnection();
    await syncLotuses(connection);
    const collection = await connection.getCollection('lotuses');
    const collectionEntry = await collection
      .find({ _id: 'LTS0257199' })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('syncNpasses', async () => {
    const connection = new PubChemConnection();
    await syncNpasses(connection);
    const collection = await connection.getCollection('npasses');
    const collectionEntry = await collection.find({ _id: 'NPC10005' }).limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('syncNpatlases', async () => {
    const connection = new PubChemConnection();
    await syncNpatlases(connection);
    const collection = await connection.getCollection('npAtlases');
    const collectionEntry = await collection
      .find({ _id: 'NPA000001' })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('syncPatents', async () => {
    const connection = new PubChemConnection();
    await syncPatents(connection);
    const collection = await connection.getCollection('patents');
    const collectionEntry = await collection.find({ _id: 5426 }).limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  }, 60000);
  it('syncPubmeds First Importation', async () => {
    const connection = new PubChemConnection();
    await syncPubmeds(connection);
    const collection = await connection.getCollection('pubmeds');
    const collectionEntry = await collection.find({ _id: 14248047 }).limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('syncPubmeds Incremental Importation', async () => {
    const connection = new PubChemConnection();
    const collection = await connection.getCollection('pubmeds');
    const collectionEntryIncremental = await collection
      .find({ _id: 17200418 })
      .limit(1);
    const resultIncremental = await collectionEntryIncremental.next();
    if (resultIncremental?._seq) {
      delete resultIncremental._seq;
    }
    expect(resultIncremental).toMatchSnapshot();
    await connection.close();
  });
  it('aggregate activeAgainst', async () => {
    const connection = new PubChemConnection();
    await aggregateActiveAgainst(connection);
    const collection = await connection.getCollection('activeAgainst');
    const collectionEntry = await collection
      .find({
        _id: 'ArchaeakingdomCandidatus BorrarchaeotaCandidatus Borrarchaeia',
      })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('aggregate activesOrNaturals', async () => {
    const connection = new PubChemConnection();

    await aggregateActivesOrNaturals(connection);
    const collection = await connection.getCollection('activesOrNaturals');
    const collectionEntry = await collection
      .find({
        _id: 'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
      })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  }, 60000);
  it('aggregate CHNOSClF', async () => {
    const connection = new PubChemConnection();
    await aggregateCHNOSClF(connection);
    const collection = await connection.getCollection('mfsCHNOSClF');
    const collectionEntry = await collection
      .find({
        _id: 'C100H110N4',
      })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('aggregate CommonMFs', async () => {
    const connection = new PubChemConnection();

    await aggregateCommonMFs(connection);
    const collection = await connection.getCollection('mfsCommon');
    const collectionEntry = await collection
      .find({
        _id: 'C100H110N4',
      })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
  it('aggregate MFs', async () => {
    const connection = new PubChemConnection();
    await aggregateMFs(connection);
    const collection = await connection.getCollection('mfs');
    const collectionEntry = await collection
      .find({
        _id: 'C12H9N3S2',
      })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
}, 60000);
