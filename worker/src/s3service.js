import AWS from 'aws-sdk';
import stream from 'stream';

export default class S3Service {
  s3;

  constructor(config) {
    this.s3 = new AWS.S3({
      ...config,
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

    const params = { Bucket: bucketName, Key: keyName, Body: pass };

    return {
      writeStream: pass,
      promise: this.s3.upload(params).promise()
    };
  }
}
