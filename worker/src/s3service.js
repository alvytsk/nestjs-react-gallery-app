import AWS from 'aws-sdk';
// import * as AWS from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import stream from 'stream';

export default class S3Service {
  s3;

  constructor(config) {
    this.s3 = new AWS.S3({
      ...config,
      region: 'us-east-1',
      s3ForcePathStyle: true, // needed with minio
      signatureVersion: 'v4'
    });

    //check connection
    this.s3.headBucket(
      {
        Bucket: 'test'
      },
      function (err, data) {
        if (err) console.log(err, err.stack);
      }
    );
  }

  async uploadFile({ bucketName, keyName, data }) {
    return this.s3
      .upload({
        Bucket: bucketName,
        Body: data,
        Key: keyName
      })
      .promise();
  }

  getReadableStream({ bucketName, keyName }) {
    const params = {
      Bucket: bucketName,
      Key: keyName
    };

    const readStream = this.s3.getObject(params).createReadStream();

    readStream.on('error', (e) => {
      console.error(e.message);
      return { error: e.message };
    });

    return readStream;
  }

  uploadStream({ bucketName, keyName }) {
    const pass = new stream.PassThrough();

    // const upload = new Upload({
    //   client: this.s3,
    //   params: { Bucket: bucketName, Key: keyName, Body: pass }
    // });

    // upload.done().then((res, error) => {
    //   console.log(res);
    // });

    // return pass;

    const params = { Bucket: bucketName, Key: keyName, Body: pass };

    return {
      writeStream: pass,
      promise: this.s3.upload(params).promise()
    };
  }
}
