import mongoose from 'mongoose';

export default class Database {
  constructor(config) {
    this.connect(config.uri);
  }

  connect(uri) {
    mongoose
      .connect(uri)
      .then(() => {
        console.log('Database connection successful');
      })
      .catch((err) => {
        console.error('Database connection error');
      });
  }
}
