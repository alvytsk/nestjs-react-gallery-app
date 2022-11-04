import {
  Injectable,
  Req,
  HttpException,
  HttpStatus,
  BadRequestException,
  ConflictException,
  RequestTimeoutException,
  BadGatewayException,
} from '@nestjs/common';
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
    console.log(originalFilename);

    // const timestamp = Date.now().toString();
    const hashedFileName = crypto
      .createHash('md5')
      .update(originalFilename)
      .digest('hex');
    const extension = originalFilename.substring(
      originalFilename.lastIndexOf('.'),
      originalFilename.length,
    );

    console.log(hashedFileName);

    return { filename: hashedFileName, extension: extension };
  }

  private checkFileType(file): boolean {
    if (!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))) {
      return false;
    }

    return true;
  }

  // private generateThumbnail = async (
  //   input,
  //   maxDimension = { width: 640, height: 480 },
  //   square = false,
  // ) => {
  //   const transform = sharp()
  //     .resize({
  //       width: maxDimension.width,
  //       height: square ? maxDimension.width : maxDimension.height,
  //       fit: square ? 'cover' : 'inside',
  //     })
  //     .sharpen()
  //     .webp({ quality: 80 })
  //     .on('info', (info) => {
  //       console.log({ info });
  //     });

  //   return input.pipe(transform);
  // };

  async generateThumbnail(thumbFile: UploadedDto, file: UploadedDto) {
    try {
      thumbFile.buffer = await sharp(file.buffer)
        .resize(200, 200)
        .sharpen()
        .webp({ quality: 80 })
        .toBuffer();
      return thumbFile;
    } catch (err) {
      throw new ConflictException(err.keyValue);
    }
  }

  checkFiles(files: Array<UploadedDto>) {
    if (!files || files.length === 0) {
      throw new BadRequestException({ message: 'no files provided' });
    }
    files.forEach((file) => {
      if (!this.checkFileType(file)) {
        throw new HttpException(
          'File type not supported',
          HttpStatus.BAD_REQUEST,
        );
      }
    });
  }

  async uploadFile(files: Array<UploadedDto>) {
    this.checkFiles(files);

    try {
      const result = await Promise.all(
        files.map(async (file) => await this.processThumbnails(file)),
      );

      // console.log(result);
      return result;
    } catch (err) {
      console.log(err);
      throw new BadGatewayException(err);
    }
  }

  async processThumbnails(file: UploadedDto) {
    const hashedFilename = this.generateHashedFilename(file.originalname);
    const imageType = file.mimetype.match(/^image\/(.*)/)[1];
    const promises = [];

    const thumbFile: UploadedDto = {
      ...file,
      hashedname: hashedFilename.filename + '-thumbnail.webp',
      buffer: null,
    };

    promises.push(
      this.cloudService.uploadFile(
        await this.generateThumbnail(thumbFile, file),
      ),
    );
    promises.push(
      this.cloudService.uploadFile({
        ...file,
        hashedname: file.originalname,
      }),
    );

    const result = await Promise.all(promises).then(async () => {
      const fileObject = {
        name: file.originalname,
        url: await this.cloudService.generatePresignedUrl(thumbFile.hashedname),
        type: file.mimetype,
        id: file.fieldname,
      };

      // console.log(fileObject);

      return fileObject;
    });

    await this.pushImageFileToDB(hashedFilename.filename, file);

    return result;
  }

  async pushImageFileToDB(id: string, file: UploadedDto) {
    const imageData = {
      id,
      original: {
        name: file.originalname,
        mimeType: file.mimetype,
      },
      thumbnail: {
        path: '',
        key: '',
        bucket: '',
      },
      image: {
        bucket: '',
        key: '',
        path: '',
      },
    };
    await this.saveFile(imageData);
  }

  async saveFile(awsFile: any) {
    try {
      const newFile = new this.uploadedFileModel(awsFile);
      await newFile.save();
    } catch (error) {
      throw new ConflictException(error.keyValue);
    }
  }
}
