import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { UploadedDto } from 'src/cloud/dto/uploaded.dto';

@Injectable()
export class CloudService {
  constructor(private readonly configService: ConfigService) {}

  async uploadFile(file: UploadedDto) {
    const s3 = new S3({
      accessKeyId: this.configService.get('MINIO_ACCESS_KEY'),
      secretAccessKey: this.configService.get('MINIO_SECRET_KEY'),
      endpoint: this.configService.get('MINIO_URI'),
      s3ForcePathStyle: true, // needed with minio
      signatureVersion: 'v4',
    });

    await s3
      .upload({
        Bucket: 'test',
        Body: file.buffer,
        Key: file.fieldname + '_' + file.originalname,
        ContentType: file.mimetype,
      })
      .promise();
  }
}
