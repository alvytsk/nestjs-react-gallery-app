import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '~/hooks/state';
import { deleteImage, getUploadingStatus } from '~/state/gallerySlice';
import { GalleryItemDTO } from '~/types/gallery';

const GalleryItem: React.FC<{ file: GalleryItemDTO }> = ({ file }) => {
  const dispatch = useAppDispatch();

  const onDelete = () => {
    dispatch(deleteImage(file.id));
  };

  return (
    <div className="gallery__item">
      <img src={file.url} alt={file.name} />
      <div className="item__overlay">
        <div className="item__overlay-text">{file.name}</div>
        <button>Download</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
};

export default GalleryItem;
