import { Injectable, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import sharp from 'sharp';
import { UploadedFile, UploadedFileDocument } from './schemas/file.schema';
import { CloudService } from '../cloud/cloud.service';
import { UploadedDto } from 'src/cloud/dto/uploaded.dto';

@Injectable()
export class GalleryService {
  constructor(
    private configService: ConfigService,
    private cloudService: CloudService,
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

  async uploadFile(file: UploadedDto) {
    if (!this.checkFileType(file)) {
      throw new HttpException(
        'File type not supported',
        HttpStatus.BAD_REQUEST,
      );
    }

    const promises = [];
    const hashedFilename = this.generateHashedFilename(file.originalname);

    const imageType = file.mimetype.match(/^image\/(.*)/)[1];
    // console.log(imageType);

    console.log(file);

    const thumbFile: UploadedDto = {
      ...file,
      hashedname: hashedFilename.filename + '-thumbnail.webp',
      buffer: null,
    };

    //generate thumbnail
    try {
      thumbFile.buffer = await sharp(file.buffer)
        .resize(200, 200)
        .sharpen()
        .webp({ quality: 80 })
        .toBuffer();
    } catch (err) {
      console.log(err);
    }

    promises.push(this.cloudService.uploadFile(thumbFile));
    promises.push(
      this.cloudService.uploadFile({
        ...file,
        hashedname: hashedFilename.filename + hashedFilename.extension,
      }),
    );

    return Promise.all(promises).then((values) => {
      console.log(values);

      // push all info to db
      const imageData = {
        id: hashedFilename.filename,
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
