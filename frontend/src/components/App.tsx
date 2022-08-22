import React from 'react';
import './app.scss';
import Gallery from './Gallery';
import UploadForm from './UploadForm';

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
