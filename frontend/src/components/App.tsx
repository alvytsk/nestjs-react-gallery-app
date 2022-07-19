import React from 'react';
import './app.scss';
import UploadForm from './UploadForm';

const App = () => {
  return (
    <section className="container">
      <div className="app-wrapper">
        <UploadForm />
      </div>
    </section>
  );
};

export default App;
