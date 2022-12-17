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
import { UploadedFile, UploadedFileDocument } from './schemas/file.schema';
import { CloudService } from '../cloud/cloud.service';
import { UploadedDto } from 'src/cloud/dto/uploaded.dto';
import Queue from 'bull';

@Injectable()
export class GalleryService {
  private filesProcQueue: Queue.Queue<any>;
  private periodicTestQueue: Queue.Queue<any>;

  constructor(
    private configService: ConfigService,
    private cloudService: CloudService,
    @InjectModel(UploadedFile.name)
    private uploadedFileModel: Model<UploadedFileDocument>,
  ) {
    this.filesProcQueue = new Queue('files-processing', 'redis://redis:6379');
    this.periodicTestQueue = new Queue('test-queue', 'redis://redis:6379');

    this.periodicTestQueue.add(
      { foo: 'bar' },
      // {
      //   repeat: {
      //     every: 5000,
      //     limit: 10,
      //   },
      // },
      // Repeat payment job once every day at 3:15 (am)
      { repeat: { cron: '45 8 * * *' } },
    );
  }

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

  // private async generateThumbnail(thumbFile: UploadedDto, file: UploadedDto) {
  //   try {
  //     thumbFile.buffer = await sharp(file.buffer)
  //       .resize(200, 200)
  //       .sharpen()
  //       .webp({ quality: 80 })
  //       .toBuffer();
  //     return thumbFile;
  //   } catch (err) {
  //     throw new ConflictException(err.keyValue);
  //   }
  // }

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

  // async uploadFiles(files: Array<UploadedDto>) {
  //   this.checkFiles(files);

  //   try {
  //     const result = await Promise.all(
  //       files.map(async (file) => await this.uploadFile(file)),
  //     );

  //     return result;
  //   } catch (err) {
  //     console.log(err);
  //     throw new BadGatewayException(err);
  //   }
  // }

  // async uploadFile(file: UploadedDto) {
  //   const hashedFilename = this.generateHashedFilename(file.originalname);
  //   const imageType = file.mimetype.match(/^image\/(.*)/)[1];
  //   const promises = [];

  //   const originalFile: UploadedDto = {
  //     ...file,
  //     hashedname: hashedFilename.filename + hashedFilename.extension,
  //   };

  //   const thumbFile: UploadedDto = {
  //     ...file,
  //     hashedname: hashedFilename.filename + '-thumbnail.webp',
  //     buffer: null,
  //   };

  //   promises.push(
  //     this.cloudService.uploadFile(
  //       await this.generateThumbnail(thumbFile, file),
  //     ),
  //   );
  //   promises.push(this.cloudService.uploadFile(originalFile));

  //   let result = await Promise.all(promises).then(async () => {
  //     const fileObject = {
  //       name: file.originalname,
  //       hashedname: file.hashedname,
  //       url: await this.cloudService.generatePresignedUrl(thumbFile.hashedname),
  //       type: file.mimetype,
  //       id: file.fieldname,
  //     };

  //     return fileObject;
  //   });

  //   const record = await this.pushImageFileToDB(
  //     hashedFilename.filename,
  //     originalFile.originalname,
  //     originalFile.mimetype,
  //     originalFile.hashedname,
  //     thumbFile.hashedname,
  //   );

  //   // console.log({ record });

  //   result = {
  //     ...result,
  //     id: record._id,
  //   };

  //   // console.log({ result });

  //   return result;
  // }

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
          type: file.type,
          id: file.id,
          _id: file._id,
        };
      }),
    );

    return result;
  }

  async deleteFile(id: string) {
    const file: UploadedFile = await this.uploadedFileModel.findById(id);

    const promises = [];

    promises.push(this.cloudService.deleteFile(file.hashedName));
    promises.push(this.cloudService.deleteFile(file.thumbnail));

    await Promise.all(promises).then(async () => {
      await this.uploadedFileModel.findByIdAndDelete(id);
    });

    return id;
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
      type: mimeType,
      hashedName: hashedFilename,
      thumbnail: thumbnailFilename,
    };

    return await this.saveFile(imageData);
  }

  private async saveFile(awsFile: any) {
    try {
      const newFile = new this.uploadedFileModel(awsFile);
      return await newFile.save();
    } catch (error) {
      throw new ConflictException(error.keyValue);
    }
  }

  async execUploadedFile(data: {
    fileId: string;
    originalFilename: string;
    type: string;
  }) {
    console.log({ data });

    const job = await this.filesProcQueue.add(data);

    console.log(`Job ${job.id} created`);

    return {
      jobId: job.id,
    };
  }

  async testQueue(files: Array<UploadedDto>) {
    const job = await this.filesProcQueue.add({
      data: files,
      opts: {
        attempts: 1,
      },
    });

    console.log(`Job ${job.id} created`);

    return job.id;
  }

  async getQueueStatus(id: string | number) {
    const job = await this.filesProcQueue.getJob(id);

    if (!job) {
      return;
    }

    let progress = await job.progress();
    let data = {};
    // let result;

    const jobState = await job.getState();

    console.log({ jobState });

    if (jobState === 'completed') {
      progress = 100;

      const jobResponse = await job.finished();

      console.log({ jobResponse });

      if ('error' in jobResponse) {
        data = {
          ...jobResponse,
        };
      } else {
        data = {
          ...jobResponse,
          url: await this.cloudService.generatePresignedUrl(
            jobResponse.thumbnail,
          ),
        };
      }

      // job.remove();
    }

    return { progress, data };
  }

  async generateUrlForUpload(filename) {
    const hashedFilename = this.generateHashedFilename(filename);
    const url = await this.cloudService.generatePresignedUrl(
      hashedFilename.filename + hashedFilename.extension,
      'putObject',
    );

    return {
      url,
      hashedFilename: hashedFilename.filename + hashedFilename.extension,
    };
  }
}
