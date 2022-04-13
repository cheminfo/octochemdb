import delay from 'delay';
import md5 from 'md5';
import { MongoClient } from 'mongodb';

import Debug from './Debug.js';

const debug = Debug('PubChemConnection');

export function PubChemConnection() {
  this.client = new MongoClient(process.env.MONGODB_URL, {
    keepAlive: true,
    connectTimeoutMS: 6 * 60 * 60 * 1000,
    socketTimeoutMS: 6 * 60 * 60 * 1000,
  });
}

PubChemConnection.prototype.close = async function close() {
  if (this.connection) return this.connection.close();
  return undefined;
};

PubChemConnection.prototype.getCollectionNames =
  async function getCollectionNames() {
    return (await (await this.getDatabase()).listCollections().toArray()).map(
      (entry) => entry.name,
    );
  };

PubChemConnection.prototype.getCollection = async function getCollection(
  collectionName,
) {
  return (await this.getDatabase()).collection(collectionName);
};

PubChemConnection.prototype.geImportationtLog =
  async function geImportationtLog(options) {
    const { collectionName, sources, startSequenceID } = options;
    const logsCollection = await this.getImportationLogsCollection();
    const sourcesHash = md5(JSON.stringify(sources));
    const _id = sourcesHash;
    let logs = await logsCollection.find({ _id }).next();
    if (logs === null) {
      logs = {
        _id,
        collectionName,
        sources,
        sourcesHash,
        dateStart: Date.now(),
        dateEnd: Date.now(),
        startSequenceID,
        endSequenceID: 0,
        status: 'updating',
      };
      await logsCollection.insertOne(logs);
    }
    return logs;
  };
PubChemConnection.prototype.updateImportationLog =
  async function updateImportationLog(logs) {
    const collection = await this.getImportationLogsCollection();
    logs.dateEnd = Date.now();
    await collection.replaceOne({ _id: logs._id }, logs);
  };

PubChemConnection.prototype.getImportationLogsCollection =
  async function getCollection() {
    return (await this.getDatabase()).collection('importationLogs');
  };

PubChemConnection.prototype.getAdminCollection =
  async function getAdminCollection() {
    return this.getCollection('admin');
  };

PubChemConnection.prototype.setProgress = async function setProgress(progress) {
  const collection = await this.getAdminCollection();
  await collection.replaceOne({ _id: progress._id }, progress);
};

PubChemConnection.prototype.getProgress = async function getProgress(
  collectionName,
) {
  const adminCollection = await this.getAdminCollection();
  const _id = `${collectionName}_progress`;
  let progress = await adminCollection.find({ _id }).next();
  if (progress === null) {
    progress = {
      _id,
      state: 'import',
      seq: 0,
      date: new Date(),
    };
    await adminCollection.insertOne(progress);
  }
  return progress;
};

PubChemConnection.prototype.getDatabase = async function getDatabase() {
  while (true) {
    try {
      await this.init();
      break;
    } catch (e) {
      debug('Connection to mongo failed, waiting 5s');
      debug(e.stack);
      await delay(5000);
    }
  }
  return this.connection.db(process.env.MONGO_DB_NAME);
};

PubChemConnection.prototype.init = async function init() {
  if (this.connection) return;

  debug(`Trying to connect to: ${process.env.MONGODB_URL}`);

  this.connection = await this.client.connect();
  debug('Got DB connection');
};
