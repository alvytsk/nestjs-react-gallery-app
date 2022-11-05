import {
  Controller,
  Get,
  Post,
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

  @Post('/upload')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFiles(@UploadedFiles() files: Array<UploadedDto>) {
    const result = await this.galleryService.uploadFiles(files);
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
}
