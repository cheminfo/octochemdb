'use strict';

const delay = require('delay');
const { MongoClient } = require('mongodb');
const debug = require('debug')('PubChemConnection');

function PubChemConnection() {
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

PubChemConnection.prototype.setProgress = async function getProgress(progress) {
  const collection = await this.getAdminCollection();
  await collection.updateOne({ _id: progress._id }, { $set: progress });
};

PubChemConnection.prototype.getProgress = async function getProgress(
  collectionName,
) {
  const adminCollection = await this.getAdminCollection();
  const _id = `${collectionName}_progress`;
  let progress = await adminCollection.find({ _id }).next();
  if (progress === null) {
    debug('Starting new database construction.');
    progress = {
      _id,
      state: 'import',
      seq: 0,
      date: new Date(),
    };
    await adminCollection.insertOne(progress);
  } else {
    if (progress.state === 'update') {
      debug('First importation has been completed. Should only update.');
    } else {
      debug(`Continuing first importation from ${progress.seq}.`);
    }
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

module.exports = PubChemConnection;
