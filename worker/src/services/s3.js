// import AWS from 'aws-sdk';
import {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import stream from 'stream';

export default class S3Service {
  _s3;
  _error = '';

  constructor(config) {
    this._s3 = new S3Client({
      ...config,
      s3ForcePathStyle: true, // needed with minio
      signatureVersion: 'v4'
    });

    //check connection
    this.getBuckets();
  }

  async getBuckets() {
    try {
      const listBucketsResult = await this._s3.send(new ListBucketsCommand({}));

      console.log(listBucketsResult.Buckets);
    } catch (e) {
      console.log('ListBucketsCommand error:', e.message);
    }
  }

  async uploadFile({ bucketName, keyName, data }) {
    try {
      // uploading object with string data on Body
      await this._s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: keyName,
          Body: data
        })
      );

      console.log(`Successfully uploaded ${bucketName}/${keyName}`);
    } catch (e) {
      console.log('PutObjectCommand error: ', e.message);
    }
  }

  async getReadableStream({ bucketName, keyName }) {
    let data;

    try {
      data = await this._s3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: keyName
        })
      );
    } catch (e) {
      console.log('GetObjectCommand error: ', e.message);
    }

    return data.Body;
  }

  uploadStream({ bucketName, keyName }) {
    const writeStream = new stream.PassThrough();

    const params = { Bucket: bucketName, Key: keyName, Body: writeStream };

    const upload = new Upload({
      client: this._s3,
      params
    });

    const promise = upload.done();

    return {
      stream: writeStream,
      promise
    };
  }
}
