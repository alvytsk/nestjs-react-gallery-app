import * as crypto from 'crypto';

export const generateHashedFilename = (originalFilename) => {
  const hashedFileName = crypto.createHash('md5').update(originalFilename).digest('hex');
  const extension = originalFilename.substring(
    originalFilename.lastIndexOf('.'),
    originalFilename.length
  );

  return { filename: hashedFileName, extension: extension };
};
