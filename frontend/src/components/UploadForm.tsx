import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '~/hooks/state';
import { uploadImage, getUploadingStatus } from '~/state/gallerySlice';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const jobId = useAppSelector((state) => state.gallery.jobId);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const pollInterval = setInterval(() => {
      jobId && dispatch(getUploadingStatus(jobId));
    }, 1000);

    if (!jobId && pollInterval) {
      clearInterval(pollInterval);
    }

    return () => clearInterval(pollInterval);
  }, [dispatch, jobId]);

  const onUpload = (event) => {
    event.preventDefault();
    file && dispatch(uploadImage(file));
    setFile(null);
  };

  const onFileChange = (event) => {
    setFile(event.target.files);
  };

  return (
    <div>
      <form onSubmit={onUpload}>
        <input multiple type="file" onChange={onFileChange} />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default UploadForm;
