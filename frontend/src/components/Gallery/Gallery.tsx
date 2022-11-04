import React from 'react';
import GalleryItem from './GalleryItem';
// import { GalleryFileDTO } from '~/types/gallery';
import { useAppSelector } from '~/hooks/state';
import './gallery.scss';

const Gallery = () => {
  const files = useAppSelector((state) => state.gallery.files);

  // const files: GalleryFileDTO[] = [
  //   {
  //     id: '0',
  //     name: '',
  //     type: '',
  //     url: 'https://www.quackit.com/pix/samples/15l.jpg'
  //   },
  //   {
  //     id: '1',
  //     name: '',
  //     type: '',
  //     url: 'https://www.quackit.com/pix/samples/15l.jpg'
  //   },
  //   {
  //     id: '2',
  //     name: '',
  //     type: '',
  //     url: 'https://www.quackit.com/pix/samples/15l.jpg'
  //   }
  // ];

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
