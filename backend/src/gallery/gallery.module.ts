import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadedFile, UploadedFileSchema } from './schemas/file.schema';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { CloudService } from 'src/cloud/cloud.service';

@Module({
  controllers: [GalleryController],
  providers: [GalleryService, CloudService],
  imports: [
    MongooseModule.forFeature([
      { name: UploadedFile.name, schema: UploadedFileSchema },
    ]),
  ],
})
export class UserModule {}
