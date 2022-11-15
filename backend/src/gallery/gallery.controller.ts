import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Param,
  UseInterceptors,
  HttpStatus,
  UploadedFiles,
  Delete,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UploadedDto } from 'src/cloud/dto/uploaded.dto';
import { GalleryService } from './gallery.service';
import { Response } from 'express';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  getUser(@Res() res) {
    return res.status(HttpStatus.OK).json({
      status: 200,
      data: 'Got!!!',
    });
  }

  @Get('/getAll')
  async getAllFiles(@Res() res) {
    const todos = await this.galleryService.getAll();
    return res.status(HttpStatus.OK).json({
      status: 200,
      data: todos,
    });
  }

  @Get('/getSignedUrl/:filename')
  async getSignedUrl(
    @Param('filename') filename: string,
    @Res() response: Response,
  ) {
    const result = await this.galleryService.generateUrlForUpload(filename);

    return response.status(HttpStatus.OK).json(result);
  }

  @Get('/uploaded/:hashedFilename')
  async uploadedFile(
    @Param('hashedFilename') hashedFilename: string,
    @Res() response: Response,
  ) {
    console.log('uploadedFile');
    const result = await this.galleryService.execUploadedFile(hashedFilename);
    return response.status(HttpStatus.OK).json(result);
  }

  @Post('/upload')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFiles(@UploadedFiles() files: Array<UploadedDto>) {
    // const result = await this.galleryService.uploadFiles(files);
    const result = await this.galleryService.testQueue(files);
    return result;
  }

  @Delete('/:id')
  async deleteFile(@Param('id') fileId: string) {
    const result = await this.galleryService.deleteFile(fileId);
    console.log({ result });
    return { id: result };
  }

  @Get('/download/:id')
  async dowloadFile(@Param('id') fileId: string, @Res() res: Response) {
    // const result = await this.service.uploadFile(files);
    // return result;
  }

  // @Get('test')
  // async createQueue() {
  //   const result = await this.galleryService.testQueue();
  //   return {
  //     jobId: result,
  //   };
  // }

  @Get('test/:id')
  async getJobResult(@Res() response: Response, @Param('id') id: string) {
    const result = await this.galleryService.getQueueStatus(id);

    // if (!result) {
    //   return response.sendStatus(HttpStatus.NOT_FOUND);
    // }

    return response.status(HttpStatus.OK).json(result);
  }
}
