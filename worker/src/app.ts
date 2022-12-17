// let throng = require('throng');
import throng, { WorkerCallback } from 'throng';
import Queue from 'bull';
import { spawn, exec } from 'child_process';
import { generateHashedFilename, getFilenameAndExtension } from './utils.js';
import S3Service from './services/s3.js';
import Database from './services/db.js';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import FfmpegService from './services/ffmpeg.js';

// Connect to a local redis instance locally, and the Heroku-provided URL in production
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const AWS_BUCKET = process.env.AWS_BUCKET || 'test';

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
const workers = process.env.WEB_CONCURRENCY || 1;

type MimetypeMap = {
  [key: string]: { extension: string; type: string };
};

const MIME_TYPE_MAP: MimetypeMap = {
  'image/png': { extension: 'png', type: 'image' },
  'image/jpeg': { extension: 'jpeg', type: 'image' },
  'image/jpg': { extension: 'jpg', type: 'image' },
  'image/gif': { extension: 'gif', type: 'image' },
  'image/webp': { extension: 'webp', type: 'image' },
  'image/heif': { extension: 'heic', type: 'image' },
  'video/mp4': { extension: 'mp4', type: 'video' },
  'video/quicktime': { extension: 'mov', type: 'video' }
};

function start(id: number, disconnect: () => void) {
  // Connect to the named work queue
  const fileProcQueue = new Queue('files-processing', REDIS_URL);
  const testQueue = new Queue('test-queue', REDIS_URL);

  testQueue.process(async (job, done) => {
    console.log('testQueue triggered');
    done(null, {});
  });

  console.log(`Worker ${id} started`);

  const s3 = new S3Service({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_URI,

    forcePathStyle: true // only for Minio
  });

  // console.log(s3);

  const db = new Database({ uri: process.env.MONGODB_URI });

  fileProcQueue.process(async (job, done) => {
    console.log(`fileProcQueue started at ${id} worker `);

    let progress = 0;
    const { fileId, originalFilename, type } = job.data;

    console.log({ fileId, originalFilename, type });

    // Check mimetype and return error if we can handle it
    if (!MIME_TYPE_MAP[!!type ? type : 'image/heif']) {
      console.error('File type is not supported');
      done(null, { error: 'File type is not supported' });
      return;
    }

    let result = {};

    switch (MIME_TYPE_MAP[!!type ? type : 'image/heif'].type) {
      case 'image':
        {
          const readStream = await s3.getReadableStream({
            bucketName: AWS_BUCKET,
            keyName: fileId
          });

          if (readStream && 'error' in readStream) {
            done(null, {
              error: readStream.error
            });
          }

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
                type: 'image/jpeg',
                hashedName: fileId,
                thumbnail: thumbFilename
              });

              done(null, record);
            })
            .catch((err) => {
              console.log(err.message);
              done(null, {
                error: err.message
              });
            });
          readStream.pipe(pipeline);
        }
        break;

      case 'video':
        {
          const thumbnail = getFilenameAndExtension(fileId).filename + '-sm.webm';

          const readStream = await s3.getReadableStream({
            bucketName: AWS_BUCKET,
            keyName: fileId
          });
          const writeStream = s3.uploadStream({
            bucketName: AWS_BUCKET,
            keyName: thumbnail
          }).stream;

          const ffmpegService = new FfmpegService();
          ffmpegService.probeFile(readStream);

          done(null, {});
          return;

          const transform = ffmpeg(readStream)
            // .withVideoCodec('libvpx')
            // .duration('0:3')
            // .input('./assets/watermark.png')
            // .complexFilter(['[0:v]scale=640:-1[bg];[bg][1:v]overlay=W-w-10:H-h-10'])
            // .videoCodec('libx264')
            // .audioCodec('aac')
            // .outputFormat('webm')
            // .addOutputOptions('-movflags +frag_keyframe+separate_moof+omit_tfhd_offset+empty_moov')
            // .outputOptions(['-movflags frag_keyframe+empty_moov'])
            .videoCodec('libvpx') //libvpx-vp9 could be used too
            .audioCodec('aac')
            .videoBitrate(1000, true) //Outputting a constrained 1Mbit VP8 video stream
            .outputOptions(
              '-minrate',
              '1000',
              '-maxrate',
              '1000',
              '-threads',
              '1', //Use number of real cores available on the computer - 1
              '-flags',
              '+global_header', //WebM won't love if you if you don't give it some headers
              '-psnr'
            ) //Show PSNR measurements in output. Anything above 40dB indicates excellent fidelity
            .on('end', async () => {
              console.log('<<<<< file has been converted succesfully');

              const record = await db.saveFileInfo({
                id: getFilenameAndExtension(fileId).filename,
                originalName: originalFilename,
                type,
                hashedName: fileId,
                thumbnail: thumbnail
              });

              done(null, record);
            })
            .on('progress', (progress) => {
              console.log({ progress });
              // console.log('Processing: ' + progress.percent + '% done');
            })
            .on('error', (err, stdout, stderr) => {
              console.log('an error happened: ' + err.message);
              console.log('ffmpeg stdout: ' + stdout);
              console.log('ffmpeg stderr: ' + stderr);

              done(null, result);
            })
            .on('start', () => {
              console.log('>>>> file starting');
            });

          const pipeline = transform.pipe(writeStream, { end: true });

          pipeline.on('close', () => {
            readStream.destroy();
            console.log('upload successful');
          });
        }
        break;
    }
  });

  process.on('SIGTERM', () => {
    console.log(`Worker ${id} exiting (cleanup here)`);
    disconnect();
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info

process.env.NODE_ENV === 'production'
  ? throng({ workers, start })
  : start(1, () => {
      console.log('break');
    });

// start(1);
