import { PayloadAction } from '@reduxjs/toolkit';
import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '~/hooks/state';
import {
  getUploadFileUrl,
  resetUploadingFiles,
  uploadFile,
  uploadFileCompleted
} from '~/state/gallerySlice';
import { UploadUrlDTO } from '~/types/gallery';
import FilesList from './FilesList';

const UploadForm = () => {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploading = useAppSelector((state) => state.gallery.uploading);
  const dispatch = useAppDispatch();

  // useEffect(() => {
  //   const pollHandler = setInterval(() => {
  //     jobId && dispatch(getUploadingStatus(jobId));
  //   }, 100);

  //   if (!jobId && pollHandler) {
  //     clearInterval(pollHandler);
  //   }

  //   return () => clearInterval(pollHandler);
  // }, [dispatch, jobId]);

  const onUpload = (event) => {
    event.preventDefault();

    if (files) {
      dispatch(resetUploadingFiles());
      Array.from(files).forEach(async (file) => {
        const urlResponse = await dispatch(getUploadFileUrl(file));
        // console.log(urlResponse.payload);
        if (urlResponse.payload && typeof urlResponse.payload !== 'string') {
          const url = urlResponse.payload.url;
          const uploadResponse = await dispatch(uploadFile({ file, url }));

          // if (uploadResponse.payload && typeof uploadResponse.payload !== 'string') {
          const result = await dispatch(
            uploadFileCompleted({
              hashedFilename: urlResponse.payload.hashedFilename,
              originalFilename: file.name,
              mimeType: file.type
            })
          );
          // }
        }
      });
    }

    // files && dispatch(uploadFiles(files));
    // setFiles([]);

    if (inputRef.current !== null) {
      inputRef.current.value = '';
    }
  };

  const onFileChange = (event) => {
    setFiles(event.target.files);
  };

  const onReset = (event) => {
    setFiles([]);
    if (inputRef.current !== null) {
      inputRef.current.value = '';
    }
  };

  return (
    <div>
      <form onSubmit={onUpload}>
        <input multiple type="file" ref={inputRef} onChange={onFileChange} />
        <button type="submit">Upload</button>
        {files.length ? <button onClick={onReset}>Reset</button> : null}
        <FilesList files={files} uploading={uploading} />
      </form>
    </div>
  );
};

export default UploadForm;
