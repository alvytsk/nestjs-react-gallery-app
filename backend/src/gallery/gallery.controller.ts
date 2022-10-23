import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { UploadedDto } from 'src/cloud/dto/uploaded.dto';
import { GalleryService } from './gallery.service';

@Controller('user')
export class GalleryController {
  constructor(private readonly service: GalleryService) {}

  @Get()
  getUser(@Res() res) {
    return res.status(HttpStatus.OK).json({
      status: 200,
      data: 'Got!!!',
    });
  }

  @Post('/upload')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFile(@UploadedFiles() files: Array<UploadedDto>) {
    const result = await this.service.uploadFile(files);
    return result;
  }
}
