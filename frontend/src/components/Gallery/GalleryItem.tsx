import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '~/hooks/state';
import { deleteFile, getUploadingStatus } from '~/state/gallerySlice';
import { GalleryItemDTO } from '~/types/gallery';

const GalleryItem: React.FC<{ file: GalleryItemDTO }> = ({ file }) => {
  const dispatch = useAppDispatch();

  const onDelete = () => {
    dispatch(deleteFile(file._id));
  };

  return (
    <div className="gallery__item">
      {file.type === 'image/jpeg' ? (
        <img src={file.url} alt={file.name} />
      ) : (
        <video controls>
          <source src={file.url} type="video/mp4" />
        </video>
      )}
      <div className="item__overlay">
        <div className="item__overlay-text">{file.name}</div>
        <button>Download</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
};

export default GalleryItem;
