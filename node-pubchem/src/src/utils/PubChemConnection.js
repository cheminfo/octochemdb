import Debug from 'debug';
import delay from 'delay';
import { MongoClient } from 'mongodb';

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

PubChemConnection.prototype.getCollection = async function getCollection(
  collectionName,
) {
  return (await this.getDatabase()).collection(collectionName);
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
      console.log(e);
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
