import React from 'react';
import { GalleryFile } from '~/types/gallery';

const ItemMenu: React.FC<{ file: GalleryFile }> = ({ file }) => {
  return <img src={file.url} alt={file.name} />;
};

export default ItemMenu;
