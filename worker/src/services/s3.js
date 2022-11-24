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
  s3;

  constructor(config) {
    this.s3 = new S3Client({
      ...config,
      region: 'us-east-1',
      s3ForcePathStyle: true, // needed with minio
      signatureVersion: 'v4'
    });

    //check connection
    this.getBuckets();

    // this.s3.headBucket(
    //   {
    //     Bucket: 'test'
    //   },
    //   function (err, data) {
    //     if (err) console.log(err, err.stack);
    //   }
    // );
  }

  async getBuckets() {
    const listBucketsResult = await this.s3.send(new ListBucketsCommand({}));

    console.log('getBuckets: ', listBucketsResult.Buckets);
  }

  async uploadFile({ bucketName, keyName, data }) {
    // return this.s3
    //   .upload({
    //     Bucket: bucketName,
    //     Body: data,
    //     Key: keyName
    //   })
    //   .promise();

    try {
      // uploading object with string data on Body
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: keyName,
          Body: data
        })
      );

      console.log(`Successfully uploaded ${bucketName}/${keyName}`);
    } catch (err) {
      console.log('Error', err);
    }
  }

  async getReadableStream({ bucketName, keyName }) {
    // const params = {
    //   Bucket: bucketName,
    //   Key: keyName
    // };
    // const readStream = this.s3.getObject(params).createReadStream();
    // readStream.on('error', (e) => {
    //   console.error(e.message);
    //   return { error: e.message };
    // });
    // return readStream;
    let data;

    try {
      data = await this.s3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: keyName
        })
      );
    } catch (err) {
      console.log('Error', err);
    }

    return data.Body;
  }

  uploadStream({ bucketName, keyName }) {
    const writeStream = new stream.PassThrough();

    // const upload = new Upload({
    //   client: this.s3,
    //   params: { Bucket: bucketName, Key: keyName, Body: pass }
    // });

    // upload.done().then((res, error) => {
    //   console.log(res);
    // });

    // return pass;

    const params = { Bucket: bucketName, Key: keyName, Body: writeStream };

    // return {
    //   writeStream: pass,
    //   promise: this.s3.upload(params).promise()
    // };

    const upload = new Upload({
      client: this.s3,
      params
    });

    const promise = upload.done();

    return {
      stream: writeStream,
      promise
    };
  }
}
