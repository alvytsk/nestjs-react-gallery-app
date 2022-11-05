import React, { useEffect } from 'react';
import GalleryItem from './GalleryItem';
import { useAppDispatch, useAppSelector } from '~/hooks/state';
import { getImages } from '~/state/gallerySlice';
import './gallery.scss';

const Gallery = () => {
  const files = useAppSelector((state) => state.gallery.files);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getImages());

    return;
  }, [dispatch]);

  if (!files?.length) {
    return null;
  }

  return (
    <div className="gallery">
      {files?.map((file) => (
        <GalleryItem key={file.id} file={file} />
      ))}
    </div>
  );
};

export default Gallery;
