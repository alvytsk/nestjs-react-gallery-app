export type GalleryItemDTO = {
  id: string;
  name: string;
  type: string;
  url: string;
  _id: string;
};

export type UploadingStatus = 'idle' | 'uploading' | 'thumbnail' | 'done';

export type UploadingItemDTO = {
  status: UploadingStatus;
  name: string;
  progress: number;
  hashedFilename: string;
  url: string;
  jobId: number | null;
};

export type UploadUrlDTO = {
  url: string;
  hashedFilename: string;
};
