import React from 'react';
import ItemMenu from './ItemMenu';
import { useAppSelector } from '~/hooks/state';

const GalleryItem = () => {
  const files = useAppSelector((state) => state.gallery.files);
  if (!files?.length) {
    return null;
  }
  return (
    <div>
      {files?.map((file) => (
        <ItemMenu key={file.id} file={file} />
      ))}
    </div>
  );
};

export default GalleryItem;
