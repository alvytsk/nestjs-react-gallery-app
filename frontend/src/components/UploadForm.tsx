import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '~/hooks/state';
import { uploadFiles, getUploadingStatus } from '~/state/gallerySlice';
import FilesList from './FilesList';

const UploadForm = () => {
  const [files, setFiles] = useState([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const jobId = useAppSelector((state) => state.gallery.jobId);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const pollHandler = setInterval(() => {
      jobId && dispatch(getUploadingStatus(jobId));
    }, 100);

    if (!jobId && pollHandler) {
      clearInterval(pollHandler);
    }

    return () => clearInterval(pollHandler);
  }, [dispatch, jobId]);

  const onUpload = (event) => {
    event.preventDefault();
    files && dispatch(uploadFiles(files));
    setFiles([]);

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
        {/* <FilesList {...files} /> */}
      </form>
    </div>
  );
};

export default UploadForm;
