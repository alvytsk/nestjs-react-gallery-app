import { Injectable, Req } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class UserService {
  AWS_S3_BUCKET_NAME = 'test';

  async uploadFile(@Req() file) {
    console.log(file);

    const s3Stream = new AWS.S3({
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
      endpoint: 'http://minio:9000',
      s3ForcePathStyle: true, // needed with minio?
      signatureVersion: 'v4',
    });
    const result = await s3Stream
      .upload({
        Bucket: this.AWS_S3_BUCKET_NAME,
        Key: file.originalname,
        Body: file.buffer,
      })
      .promise();

    console.log(result);
  }
}
