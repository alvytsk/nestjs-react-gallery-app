import * as crypto from 'crypto';

export const generateHashedFilename = (originalFilename: string) => {
  const hashedFileName = crypto.createHash('md5').update(originalFilename).digest('hex');

  return {
    filename: hashedFileName,
    extension: getFilenameAndExtension(originalFilename).extension
  };
};

export type FilenameWithExtension = {
  filename: string;
  extension: string;
};

export const getFilenameAndExtension = (filename: string): FilenameWithExtension => {
  const lastDot = filename.lastIndexOf('.');
  const filenameWithoutExt = filename.substring(0, lastDot) || filename;
  const extension = filename.substring(lastDot + 1, filename.length);

  return {
    filename: filenameWithoutExt,
    extension: extension
  };
};
