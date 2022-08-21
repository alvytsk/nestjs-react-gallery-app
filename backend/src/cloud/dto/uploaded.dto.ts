import { IsInt, IsMimeType, IsNotEmpty, IsString } from 'class-validator';

export class UploadedDto {
  @IsString()
  fieldname: string;

  @IsString()
  originalname: string;

  @IsString()
  encoding: string;

  @IsMimeType()
  mimetype: AppMimeType;

  @IsInt()
  size: number;

  @IsNotEmpty()
  buffer: Buffer | string;
}

export type AppMimeType = 'image/png' | 'image/jpeg';
