import AWS from 'aws-sdk';
import fs from 'fs';

export default class S3Service {
  s3;

  constructor(config) {
    // console.log({ config });

    this.s3 = new AWS.S3({
      ...config,
      s3ForcePathStyle: true, // needed with minio
      signatureVersion: 'v4'
    });

    this.s3.headBucket(
      {
        Bucket: 'test'
      },
      function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
      }
    );
  }

  async uploadFile(bucketName, keyName, data) {
    return this.s3
      .upload({
        Bucket: bucketName,
        Body: data,
        Key: keyName
      })
      .promise();
  }

  getReadableStream(bucketName, keyName) {
    const params = {
      Bucket: bucketName,
      Key: keyName
    };

    const readStream = this.s3.getObject(params).createReadStream();

    readStream.on('error', (e) => {
      console.error(e);
    });

    return readStream;
  }

  // async download(bucketName, keyName, localDest = '') {
  //   if (typeof localDest === 'undefined') {
  //     localDest = keyName;
  //   }
  //   const params = {
  //     Bucket: bucketName,
  //     Key: keyName
  //   };
  //   console.log('params: ', params);

  //   let writeStream = fs.createWriteStream(localDest);

  //   return new Promise()((resolve, reject) => {
  //     const readStream = this.s3.getObject(params).createReadStream();

  //     // Error handling in read stream
  //     readStream.on('error', (e) => {
  //       console.error(e);
  //       reject(e);
  //     });

  //     // Resolve only if we are done writing
  //     writeStream.once('finish', () => {
  //       resolve(keyName);
  //     });

  //     // pipe will automatically finish the write stream once done
  //     readStream.pipe(writeStream);
  //   });
  // }
}
