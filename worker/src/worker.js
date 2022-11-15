// let throng = require('throng');
import throng from 'throng';
import Queue from 'bull';
// import fs from 'fs';
import { generateHashedFilename, getFilenameAndExtension } from './utils.js';
// import AWS from 'aws-sdk';
import S3Service from './s3service.js';
import Database from './db.js';
import sharp from 'sharp';
// import mongoose from 'mongoose';

// console.log(process.env);

// Connect to a local redis instance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
let workers = process.env.WEB_CONCURRENCY || 1;

// console.log({ workers });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// const s3 = new AWS.S3({
//   accessKeyId: process.env.MINIO_ACCESS_KEY,
//   secretAccessKey: process.env.MINIO_SECRET_KEY,
//   endpoint: process.env.MINIO_URI,
//   s3ForcePathStyle: true, // needed with minio
//   signatureVersion: 'v4'
// });

// try {
// mongoose.connect(process.env.MONGODB_URI);
// Get the default connection
// const db = mongoose.connection;
// Bind connection to error event (to get notification of connection errors)
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// } catch (e) {
//   console.error(e);
// }

// const uploadedFileSchema = new mongoose.Schema({
//   id: String,
//   originalName: String,
//   mimeType: String,
//   hashedName: String,
//   thumbnail: String
// });
// // Compile model from schema
// const uploadedFileModel = mongoose.model('UploadedFile', uploadedFileSchema);

async function generateThumbnail(thumbFile, file) {
  try {
    thumbFile.buffer = await sharp(new Buffer.from(file.buffer, 'binary'))
      .resize(200, 200)
      .sharpen()
      .webp({ quality: 80 })
      .toBuffer();
    return thumbFile;
  } catch (err) {
    console.log(err);
    // throw new ConflictException(err.keyValue);
  }
}

function uploadToCloud(file) {
  // console.log(file);

  return s3
    .upload({
      Bucket: 'test',
      Body: new Buffer.from(file.buffer, 'binary'),
      Key: file.hashedname,
      ContentType: file.mimetype
    })
    .promise();
}

async function pushImageFileToDB(id, original, mimeType, hashedFilename, thumbnailFilename) {
  const imageData = {
    id,
    originalName: original,
    mimeType: mimeType,
    hashedName: hashedFilename,
    thumbnail: thumbnailFilename
  };

  // const uploadFileModelInstance = new uploadedFileModel(imageData);
  // return uploadFileModelInstance.save();
}

async function uploadFile(file) {
  const hashedFilename = generateHashedFilename(file.originalname);
  const promises = [];
  const originalFile = {
    ...file,
    hashedname: hashedFilename.filename + hashedFilename.extension
  };
  const thumbFile = {
    ...file,
    hashedname: hashedFilename.filename + '-thumbnail.webp',
    buffer: null
  };

  promises.push(uploadToCloud(await generateThumbnail(thumbFile, file)));
  promises.push(uploadToCloud(originalFile));

  let result = await Promise.all(promises).then(async () => {
    const fileObject = {
      name: file.originalname,
      hashedname: file.hashedname,
      // url: await this.cloudService.generatePresignedUrl(thumbFile.hashedname),
      type: file.mimetype,
      id: file.fieldname
    };

    return fileObject;
  });

  const record = await pushImageFileToDB(
    hashedFilename.filename,
    originalFile.originalname,
    originalFile.mimetype,
    originalFile.hashedname,
    thumbFile.hashedname
  );

  // console.log({ record });

  result = {
    ...result,
    id: record._id,
    thumbFile: thumbFile.hashedname
  };

  return result;
}

function start(id) {
  // Connect to the named work queue
  const fileProcQueue = new Queue('files-processing', REDIS_URL);

  console.log(`Worker ${id} started`);

  const s3 = new S3Service({
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
    endpoint: process.env.MINIO_URI
  });

  const db = new Database({ uri: process.env.MONGODB_URI });

  fileProcQueue.process(async (job, done) => {
    let progress = 0;
    const { fileId, originalFilename, mimeType } = job.data;

    let result = {};

    console.log(fileId, originalFilename, mimeType);

    const readStream = s3.getReadableStream('test', fileId);
    const pipeline = sharp();
    pipeline
      .resize(200, 200)
      .sharpen()
      .webp({ quality: 80 })
      .toBuffer()
      .then(async (data) => {
        const thumbFilename = `${getFilenameAndExtension(fileId).filename}-thumbnail.webp`;

        await s3.uploadFile('test', thumbFilename, data);

        const record = await db.saveFileInfo({
          id: getFilenameAndExtension(fileId).filename,
          originalName: originalFilename,
          mimeType: mimeType,
          hashedName: fileId,
          thumbnail: thumbFilename
        });

        console.log({ record });

        result = {
          ...record,
          id: record._id
        };
      })
      .catch((err) => {
        console.log(err);
      });
    readStream.pipe(pipeline);

    // const writeStream = await sharp(new Buffer.from(file.buffer, 'binary'))
    //   .resize(200, 200)
    //   .sharpen()
    //   .webp({ quality: 80 })
    //   .toBuffer();

    // let progressStep = 100 / files.length;
    // const result = await Promise.all(files.map(async (file) => await uploadFile(file)));

    // job.progress(100);

    console.log(result);

    done(null, result);
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ workers, start });
// start(1);
