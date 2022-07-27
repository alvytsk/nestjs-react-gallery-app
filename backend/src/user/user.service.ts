import { Injectable, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(private configService: ConfigService) {}

  private generateHashedFilename(originalFilename: string): string {
    const timestamp = Date.now().toString();
    const hashedFileName = crypto
      .createHash('md5')
      .update(timestamp)
      .digest('hex');
    const extension = originalFilename.substring(
      originalFilename.lastIndexOf('.'),
      originalFilename.length,
    );

    return hashedFileName + extension;
  }

  private checkFileType(file): boolean {
    if (!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))) {
      return false;
    }

    return true;
  }

  async uploadFile(@Req() file) {
    if (!this.checkFileType(file)) {
      throw new HttpException(
        'File type not supported',
        HttpStatus.BAD_REQUEST,
      );
    }

    const s3 = new S3({
      accessKeyId: this.configService.get('MINIO_ACCESS_KEY'),
      secretAccessKey: this.configService.get('MINIO_SECRET_KEY'),
      endpoint: this.configService.get('MINIO_URI'),
      s3ForcePathStyle: true, // needed with minio
      signatureVersion: 'v4',
    });

    const promises = [];

    //if it's an image - generate thumbnail
    {
      //...
    }

    //Upload source file
    const uploadFilePromise = s3
      .upload({
        Bucket: this.configService.get('MINIO_BUCKET_NAME'),
        Key: this.generateHashedFilename(file.originalname),
        Body: file.buffer,
      })
      .promise();

    promises.push(uploadFilePromise);

    return Promise.all(promises).then((values) => {
      return values[0];
    });
  }
}
