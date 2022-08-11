import { Injectable, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { S3 } from 'aws-sdk';
import * as crypto from 'crypto';
import sharp from 'sharp';
import { BufferedFile } from './file.model';
import { UploadedFile, UploadedFileDocument } from '../schemas/file.schema';

@Injectable()
export class UserService {
  constructor(
    private configService: ConfigService,
    @InjectModel(UploadedFile.name)
    private uploadedFileModel: Model<UploadedFileDocument>,
  ) {}

  private generateHashedFilename(originalFilename: string): {
    filename: string;
    extension: string;
  } {
    const timestamp = Date.now().toString();
    const hashedFileName = crypto
      .createHash('md5')
      .update(timestamp)
      .digest('hex');
    const extension = originalFilename.substring(
      originalFilename.lastIndexOf('.'),
      originalFilename.length,
    );

    return { filename: hashedFileName, extension: extension };
  }

  private checkFileType(file): boolean {
    if (!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))) {
      return false;
    }

    return true;
  }

  private generateThumbnail = async (
    input,
    maxDimension = { width: 640, height: 480 },
    square = false,
  ) => {
    const transform = sharp()
      .resize({
        width: maxDimension.width,
        height: square ? maxDimension.width : maxDimension.height,
        fit: square ? 'cover' : 'inside',
      })
      .sharpen()
      .webp({ quality: 80 })
      .on('info', (info) => {
        console.log({ info });
      });

    return input.pipe(transform);
  };

  async uploadFile(file: BufferedFile) {
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
    const filename = this.generateHashedFilename(file.originalname);

    const imageType = file.mimetype.match(/^image\/(.*)/)[1];

    // console.log({ filename });

    //Upload thumbnail
    const uploadThumbnailPromise = s3
      .upload({
        Bucket: 'test',
        Key: `${filename.filename}_thumbnail.webp`,
        Body: await sharp(file.buffer)
          .resize(200, 200)
          .sharpen()
          .webp({ quality: 80 })
          .toBuffer(),
      })
      .promise();
    promises.push(uploadThumbnailPromise);

    //Upload source file
    const uploadFilePromise = s3
      .upload({
        Bucket: this.configService.get('MINIO_BUCKET_NAME'),
        Key: `${filename.filename}${filename.extension}`,
        Body: file.buffer,
      })
      .promise();

    promises.push(uploadFilePromise);

    return Promise.all(promises).then((values) => {
      //push all info to db
      const imageData = {
        id: filename.filename,
        original: {
          name: file.originalname,
          mimeType: file.mimetype,
        },
        thumbnail: {
          path: values[0].Location,
          key: values[0].Key,
          bucket: values[0].Bucket,
        },
        image: {
          bucket: values[1].Bucket,
          key: values[1].Key,
          path: values[1].Location,
        },
      };

      const record = new this.uploadedFileModel({
        ...imageData,
      });
      record.save();

      return imageData;
    });
  }
}
