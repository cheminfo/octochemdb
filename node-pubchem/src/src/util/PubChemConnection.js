'use strict';

const delay = require('delay');
const MongoClient = require('mongodb').MongoClient;

const config = require('./config');

function PubChemConnection() {}

PubChemConnection.prototype.close = function close() {
  if (this.connection) return this.connection.close();
  return undefined;
};

PubChemConnection.prototype.getMoleculesCollection = async function getDatabase() {
  return (await this.getDatabase()).collection('molecules');
};

PubChemConnection.prototype.getAdminCollection = async function getDatabase() {
  return (await this.getDatabase()).collection('admin');
};

PubChemConnection.prototype.getMfsCollection = async function getDatabase() {
  return (await this.getDatabase()).collection('mfs');
};

PubChemConnection.prototype.getMfStatsCollection = async function getDatabase() {
  return (await this.getDatabase()).collection('mfstats');
};

PubChemConnection.prototype.getDatabase = async function getDatabase() {
  while (true) {
    try {
      await this.init();
      break;
    } catch (e) {
      console.log('Connection to mongo failed, waiting 5s');
      await delay(5000);
    }
  }
  return this.connection.db(config.databaseName);
};

PubChemConnection.prototype.getCollection = async function getCollection(
  collectionName,
) {
  return (await this.getDatabase()).collection(collectionName);
};

PubChemConnection.prototype.init = async function init() {
  if (this.connection) return;

  this.connection = await MongoClient.connect(config.mongodbUrl, {
    autoReconnect: true,
    keepAlive: true,
    connectTimeoutMS: 6 * 60 * 60 * 1000,
    socketTimeoutMS: 6 * 60 * 60 * 1000,
  });
};

module.exports = PubChemConnection;
