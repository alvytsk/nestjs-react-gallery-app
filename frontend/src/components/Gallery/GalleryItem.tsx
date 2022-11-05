import React from 'react';
import { GalleryItemDTO } from '~/types/gallery';

const GalleryItem: React.FC<{ file: GalleryItemDTO }> = ({ file }) => {
  return (
    <div className="gallery__item">
      <img src={file.url} alt={file.name} />
      <div className="item__overlay">
        <div className="item__overlay-text">{file.name}</div>
        <button>Download</button>
      </div>
    </div>
  );
};

export default GalleryItem;
