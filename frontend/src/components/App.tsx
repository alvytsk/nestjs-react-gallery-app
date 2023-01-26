import React, { useEffect, useState } from 'react';
import './app.scss';
import UploadForm from './UploadForm';
import Gallery from './Gallery/Gallery';

const App = () => {
  return (
    <section className="container">
      <div className="app-wrapper">
        <UploadForm />
        <Gallery />
      </div>
    </section>
  );
};

export default App;
