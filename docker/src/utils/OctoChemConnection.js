import delay from 'delay';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

import debugLibrary from './Debug.js';

dotenv.config();

const debug = debugLibrary('OctoChemConnection');

export function OctoChemConnection() {
  // @ts-ignore
  this.client = new MongoClient(process.env.MONGODB_URL, {
    connectTimeoutMS: 6 * 60 * 60 * 1000,
    socketTimeoutMS: 6 * 60 * 60 * 1000,
  });
}

OctoChemConnection.prototype.close = async function close() {
  if (this.connection) return this.connection.close();
  return undefined;
};

OctoChemConnection.prototype.getCollectionNames =
  async function getCollectionNames() {
    return (await (await this.getDatabase()).listCollections().toArray()).map(
      (entry) => entry.name,
    );
  };

OctoChemConnection.prototype.getCollection = async function getCollection(
  collectionName,
) {
  return (await this.getDatabase()).collection(collectionName);
};

OctoChemConnection.prototype.getAdminCollection =
  async function getAdminCollection() {
    return this.getCollection('admin');
  };

OctoChemConnection.prototype.setProgress = async function setProgress(
  progress,
) {
  const collection = await this.getAdminCollection();
  await collection.updateOne({ _id: progress._id }, { $set: progress });
};

OctoChemConnection.prototype.getProgress = async function getProgress(
  collectionName,
) {
  const adminCollection = await this.getAdminCollection();
  const _id = `${collectionName}_progress`;
  let progress = await adminCollection.find({ _id }).next();
  if (progress === null) {
    progress = {
      _id,
      state: 'updating',
      seq: 0,
      dateStart: Date.now(),
      dateEnd: 0,
    };
    await adminCollection.insertOne(progress);
  }
  return progress;
};

OctoChemConnection.prototype.getDatabase = async function getDatabase() {
  while (true) {
    try {
      await this.init();
      break;
    } catch (e) {
      debug.error('Connection to mongo failed, waiting 5s');
      debug.error(e.stack);
      await delay(5000);
    }
  }
  return this.connection.db(process.env.MONGO_DB_NAME);
};

OctoChemConnection.prototype.init = async function init() {
  if (this.connection) return;

  debug.trace(`Trying to connect to: ${process.env.MONGODB_URL}`);

  this.connection = await this.client.connect();
  debug.trace('Got DB connection');
};
