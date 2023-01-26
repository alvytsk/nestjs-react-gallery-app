import { PayloadAction } from '@reduxjs/toolkit';
import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '~/hooks/state';
import {
  getUploadFileUrl,
  resetUploadingFiles,
  uploadFile,
  uploadFileCompleted,
  getUploadingStatus
} from '~/state/gallerySlice';
import { UploadUrlDTO } from '~/types/gallery';
import FilesList from './FilesList';

type MimetypeMap = {
  [key: string]: { extension: string; type: string };
};

const MIME_TYPE_MAP: MimetypeMap = {
  'image/png': { extension: 'png', type: 'image' },
  'image/jpeg': { extension: 'jpeg', type: 'image' },
  'image/jpg': { extension: 'jpg', type: 'image' },
  'image/gif': { extension: 'gif', type: 'image' },
  'image/webp': { extension: 'webp', type: 'image' },
  'image/heif': { extension: 'heic', type: 'image' },
  'video/mp4': { extension: 'mp4', type: 'video' },
  'video/avi': { extension: 'avi', type: 'video' },
  'video/quicktime': { extension: 'mov', type: 'video' }
};

const UploadForm = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [worker, setWorker] = useState<Worker | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploading = useAppSelector((state) => state.gallery.uploading);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const myWorker = new Worker(new URL('../workers/main.worker.ts', import.meta.url));
    setWorker(myWorker);

    return () => {
      myWorker.terminate();
    };
  }, []);

  useEffect(() => {
    let pollHandler;

    if (uploading.length) {
      uploading.every((item) => {
        if (item.jobId) {
          pollHandler = setInterval(() => {
            item.jobId && dispatch(getUploadingStatus(item.jobId));
          }, 250);
          return false;
        }
      });
    } else {
      setTimeout(() => {
        setFiles([]);
      }, 1000);
    }

    return () => clearInterval(pollHandler);
  }, [uploading, dispatch]);

  const onUpload = (event) => {
    event.preventDefault();

    if (files) {
      dispatch(resetUploadingFiles());
      Array.from(files).forEach(async (file) => {
        const urlResponse = await dispatch(getUploadFileUrl(file));
        // console.log(urlResponse.payload);
        if (urlResponse.payload && typeof urlResponse.payload !== 'string') {
          const url = urlResponse.payload.url;

          // console.log(file);
          if (MIME_TYPE_MAP[file.type].type === 'image') {
            const uploadResponse = await dispatch(uploadFile({ file, url, name: file.name }));
          } else {
            if (MIME_TYPE_MAP[file.type].type === 'video') {
              if (worker) {
                worker.postMessage({ file, url: urlResponse.payload.url });

                worker.onmessage = async function (e) {
                  console.log('front', e.data);

                  const { type, name, fixed, url } = e.data;

                  console.log({ url });

                  if (fixed) {
                    const blob = new Blob([e.data.buffer], {
                      type
                    });

                    console.log('Uploading fixed file...');
                    const uploadResponse = await dispatch(uploadFile({ file: blob, url, name }));
                  } else {
                    console.log('Uploading source file...');
                    const uploadResponse = await dispatch(
                      uploadFile({ file, url, name: file.name })
                    );
                  }
                };

                worker.onerror = function (e) {
                  console.log(e.message);
                };
              }
            }
          }

          const result = await dispatch(
            uploadFileCompleted({
              hashedFilename: urlResponse.payload.hashedFilename,
              originalFilename: file.name,
              type: file.type
            })
          );

          // console.log(url);
          // const uploadResponse = await dispatch(uploadFile({ file, url }));

          // // if (uploadResponse.payload && typeof uploadResponse.payload !== 'string') {
          // const result = await dispatch(
          //   uploadFileCompleted({
          //     hashedFilename: urlResponse.payload.hashedFilename,
          //     originalFilename: file.name,
          //     type: file.type
          //   })
          // );
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
