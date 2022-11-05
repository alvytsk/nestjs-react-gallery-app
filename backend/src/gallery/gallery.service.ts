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
import { StorageFile } from 'src/cloud/dto/download.dto';
import { fileValidationMessageList } from 'aws-sdk/clients/frauddetector';

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
    const hashedFileName = crypto
      .createHash('md5')
      .update(originalFilename)
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

  private async generateThumbnail(thumbFile: UploadedDto, file: UploadedDto) {
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

  async uploadFiles(files: Array<UploadedDto>) {
    this.checkFiles(files);

    try {
      const result = await Promise.all(
        files.map(async (file) => await this.uploadFile(file)),
      );

      return result;
    } catch (err) {
      console.log(err);
      throw new BadGatewayException(err);
    }
  }

  async uploadFile(file: UploadedDto) {
    const hashedFilename = this.generateHashedFilename(file.originalname);
    const imageType = file.mimetype.match(/^image\/(.*)/)[1];
    const promises = [];

    const originalFile: UploadedDto = {
      ...file,
      hashedname: hashedFilename.filename + hashedFilename.extension,
    };

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
    promises.push(this.cloudService.uploadFile(originalFile));

    const result = await Promise.all(promises).then(async () => {
      const fileObject = {
        name: file.originalname,
        hashedname: file.hashedname,
        url: await this.cloudService.generatePresignedUrl(thumbFile.hashedname),
        type: file.mimetype,
        id: file.fieldname,
      };

      return fileObject;
    });

    await this.pushImageFileToDB(
      hashedFilename.filename,
      originalFile.originalname,
      originalFile.mimetype,
      originalFile.hashedname,
      thumbFile.hashedname,
    );

    return result;
  }

  // async downloadFile(id: string): Promise<StorageFile> {}

  async getAll() {
    const files = await this.uploadedFileModel.find().exec();

    // const result = [];

    const result = await Promise.all(
      files.map(async (file) => {
        const url = await this.cloudService.generatePresignedUrl(
          file.thumbnail,
        );

        return {
          name: file.originalName,
          hashedname: file.hashedName,
          url: url,
          type: file.mimeType,
          id: file.id,
        };
      }),
    );

    console.log({ result });

    return result;
  }

  private async pushImageFileToDB(
    id: string,
    original: string,
    mimeType: string,
    hashedFilename: string,
    thumbnailFilename: string,
  ) {
    const imageData = {
      id,
      originalName: original,
      mimeType: mimeType,
      hashedName: hashedFilename,
      thumbnail: thumbnailFilename,
    };

    await this.saveFile(imageData);
  }

  private async saveFile(awsFile: any) {
    try {
      const newFile = new this.uploadedFileModel(awsFile);
      await newFile.save();
    } catch (error) {
      throw new ConflictException(error.keyValue);
    }
  }
}
