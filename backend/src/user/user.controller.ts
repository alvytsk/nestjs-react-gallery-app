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
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  getUser(@Res() res) {
    console.log('getUser!!!');
    return res.status(HttpStatus.OK).json({
      status: 200,
      data: 'Got!!!',
    });
  }

  @Post('/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fieldSize: 100,
      },
    }),
  )
  async uploadFile(@UploadedFile() file) {
    const result = await this.service.uploadFile(file);
    return result;
  }
}
