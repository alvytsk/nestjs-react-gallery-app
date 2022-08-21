import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UploadedFileDocument = UploadedFile & Document;

export class S3FileInformation extends Document {
  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  bucket: string;
}

export class OriginalFileInformation extends Document {
  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  bucket: string;
}

@Schema()
export class UploadedFile {
  @Prop({ required: true })
  id: string;

  @Prop({ type: S3FileInformation })
  thumbnail: S3FileInformation;

  @Prop({ type: S3FileInformation })
  image: S3FileInformation;

  @Prop({ type: OriginalFileInformation })
  original: OriginalFileInformation;
}

export const UploadedFileSchema = SchemaFactory.createForClass(UploadedFile);
