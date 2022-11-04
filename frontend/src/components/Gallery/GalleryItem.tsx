import React from 'react';
import { GalleryFileDTO } from '~/types/gallery';

const GalleryItem: React.FC<{ file: GalleryFileDTO }> = ({ file }) => {
  return (
    <div className="gallery__item">
      <img src={file.url} alt={file.name} />{' '}
    </div>
  );
};

export default GalleryItem;
