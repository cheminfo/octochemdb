import delay from 'delay';
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

PubChemConnection.prototype.getLogs = async function getCollection(
  collectionName,
) {
  const logsCollection = await this.getLogsCollection();
  const _id = `${collectionName}`;
  let logs = await logsCollection.find({ _id }).next();
  if (logs === null) {
    let sources = [];
    logs = {
      _id,
      sources,
      sourcesHash: md5(JSON.stringify(sources)),
      dataStart: 0,
      dataEnd: 0,
      startSequenceID: 123,
      endSeqneceID: 123,
      status: 'updating',
    };
    await logsCollection.insertOne(logs);
  }
  return logs;
};
PubChemConnection.prototype.setLogs = async function setLogs(logs) {
  const collection = await this.getLogsCollection();
  await collection.replaceOne({ _id: logs._id }, logs);
};
PubChemConnection.prototype.getLogsCollection = async function getCollection() {
  return (await this.getDatabase()).collection('logs');
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
