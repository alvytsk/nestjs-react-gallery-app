import mongoose from 'mongoose';

export default class Database {
  uploadedFileModel;

  constructor(config) {
    this._connect(config.uri);

    const uploadedFileSchema = new mongoose.Schema({
      id: String,
      originalName: String,
      type: String,
      hashedName: String,
      thumbnail: String
    });

    this.uploadedFileModel = mongoose.model('UploadedFile', uploadedFileSchema);
  }

  _connect(uri) {
    mongoose
      .connect(uri)
      .then(() => {
        console.log('Database connection successful');
      })
      .catch((err) => {
        console.error('Database connection error');
      });
  }

  async saveFileInfo(data) {
    const uploadFileModelInstance = new this.uploadedFileModel(data);
    return await uploadFileModelInstance.save();
  }
}
