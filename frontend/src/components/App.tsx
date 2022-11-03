import React from 'react';
import './app.scss';
import Gallery from './Gallery';
import UploadForm from './UploadForm';
import GalleryItem from './Gallery/GalleryItem';

const App = () => {
  return (
    <section className="container">
      <div className="app-wrapper">
        <UploadForm />
        <GalleryItem />
      </div>
    </section>
  );
};

export default App;
