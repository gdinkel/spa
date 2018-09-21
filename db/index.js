const mongoose = require('mongoose');
const Promise = require('bluebird');

// setup schemas
require('./schemas');

const mongooseConnection = ({
  SPA_DB_USERNAME,
  SPA_DB_PASSWORD,
  SPA_DB_NAME,
  SPA_DB_URL
}) => new Promise((resolve, reject) => {
  mongoose.connect(SPA_DB_URL, {
    user: SPA_DB_USERNAME,
    pass: SPA_DB_PASSWORD,
    dbName: SPA_DB_NAME,
    autoReconnect: true,
    promiseLibrary: Promise,
    poolSize: 5,
    keepAlive: true,
    keepAliveInitialDelay: 300000,
    reconnectTries: Number.MAX_VALUE
  }, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve(mongoose);
    }
  });
});

class MongoConnection {
  constructor() {
    this.mongoose = null;
  }

  /**
   * connect connects to mongodb
   * @returns {Promise} that resolves to the db object, otherwise it rejects with
   * an error
   */
  connect(configuration) {
    if (this.mongoose) {
      return Promise.resolve(this.mongoose);
    }
    return mongooseConnection(configuration).then((initializedMongoose) => {
      this.mongoose = initializedMongoose;
      return initializedMongoose;
    });
  }

  close() {
    return this.mongoose.disconnect().then(() => {
      this.mongoose = null;
    });
  }
}

const mongoConnection = new MongoConnection();

module.exports = mongoConnection;