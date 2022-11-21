// let throng = require('throng');
import throng from 'throng';
import Queue from 'bull';
import fs from 'fs';
import { generateHashedFilename, getFilenameAndExtension } from './utils.js';
// import AWS from 'aws-sdk';
import S3Service from './s3service.js';
import Database from './db.js';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
// import mongoose from 'mongoose';

// console.log(process.env);

// Connect to a local redis instance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
let workers = process.env.WEB_CONCURRENCY || 3;

const MIME_TYPE_MAP = {
  'image/png': { extension: 'png', type: 'image' },
  'image/jpeg': { extension: 'jpeg', type: 'image' },
  'image/jpg': { extension: 'jpg', type: 'image' },
  'image/gif': { extension: 'gif', type: 'image' },
  'image/webp': { extension: 'webp', type: 'image' },
  'image/heif': { extension: 'heic', type: 'image' },
  'video/mp4': { extension: 'mp4', type: 'video' }
};

function start(id) {
  // Connect to the named work queue
  const fileProcQueue = new Queue('files-processing', REDIS_URL);

  console.log(`Worker ${id}/${workers} started`);

  const s3 = new S3Service({
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
    endpoint: process.env.MINIO_URI
  });

  const db = new Database({ uri: process.env.MONGODB_URI });

  fileProcQueue.process(async (job, done) => {
    console.log(`fileProcQueue started at ${id} worker `);

    let progress = 0;
    const { fileId, originalFilename, mimeType } = job.data;

    //Check mimetype and return error if we can handle it
    if (!MIME_TYPE_MAP[mimeType]) {
      console.error('File type is not supported');
      done(null, { error: 'File type is not supported' });
      return;
    }

    const isImage = MIME_TYPE_MAP[mimeType].type === 'image';
    console.log({ isImage });

    let result = {};

    switch (MIME_TYPE_MAP[mimeType].type) {
      case 'image':
        {
          const readStream = s3.getReadableStream({ bucketName: 'test', keyName: fileId });
          const pipeline = sharp();
          pipeline
            .resize(200, 200)
            .sharpen()
            .composite([{ input: './assets/watermark.png', gravity: 'center' }])
            .webp({ quality: 80 })
            .toBuffer()
            .then(async (data) => {
              const thumbFilename = `${getFilenameAndExtension(fileId).filename}-thumbnail.webp`;

              await s3.uploadFile({ bucketName: 'test', keyName: thumbFilename, data });

              const record = await db.saveFileInfo({
                id: getFilenameAndExtension(fileId).filename,
                originalName: originalFilename,
                mimeType: mimeType,
                hashedName: fileId,
                thumbnail: thumbFilename
              });

              done(null, record);
            })
            .catch((err) => {
              console.log(err);
              done(null, {
                err: err.message
              });
            });
          readStream.pipe(pipeline);
        }
        break;

      case 'video':
        {
          console.log('video');

          const readStream = s3.getReadableStream({ bucketName: 'test', keyName: fileId });
          const writeStream = s3.uploadStream({
            bucketName: 'test',
            keyName: getFilenameAndExtension(fileId).filename + '-sm.mp4'
          }).writeStream;

          ffmpeg(readStream)
            .on('end', () => {
              console.log('<<<<< file has been converted succesfully');
              readStream.unpipe(writeStream);
              readStream.destroy();
              writeStream.destroy();
              done(null, result);
            })
            .on('progress', (progress) => {
              console.log({ progress });
              // console.log('Processing: ' + progress.percent + '% done');
            })
            .on('error', (err, stdout, stderr) => {
              console.log('an error happened: ' + err.message);
              console.log('ffmpeg stdout: ' + stdout);
              console.log('ffmpeg stderr: ' + stderr);
              readStream.unpipe(writeStream);
              readStream.destroy();
              writeStream.destroy();
              done(null, result);
            })
            .on('start', () => {
              console.log('>>>> file starting');
            })
            // .size('640x480')
            .duration('0:3')
            .input('./assets/watermark.png')
            .complexFilter(['[0:v]scale=640:-1[bg];[bg][1:v]overlay=W-w-10:H-h-10'])
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputFormat('mp4')
            .outputOptions(['-movflags frag_keyframe+empty_moov'])
            .pipe(writeStream, { end: true });
        }
        break;
    }

    // console.log(`fileProcQueue finished at ${id} worker `);

    // done(null, { test: '222' });
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ workers, start });
// start(1);
