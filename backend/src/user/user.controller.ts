import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  @Get()
  getUser(@Res() res) {
    console.log('getUser!!!');
    return res.status(HttpStatus.OK).json({
      status: 200,
      data: 'Got!!!',
    });
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file) {
    console.log(file);
  }
}
