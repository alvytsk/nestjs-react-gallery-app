import React from 'react';
import { GalleryFileDTO } from '~/types/gallery';

const GalleryItem: React.FC<{ file: GalleryFileDTO }> = ({ file }) => {
  return (
    <div className="gallery__item">
      <img src={file.url} alt={file.name} />
      <div className="item__overlay">
        <div className="item__overlay-text">{file.name}</div>
      </div>
    </div>
  );
};

export default GalleryItem;
