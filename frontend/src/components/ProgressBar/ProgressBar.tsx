import React from 'react';
import './progressbar.scss';

const ProgressBar = (props: { progress: number }) => {
  const { progress } = props;

  return (
    <div className="pb-container">
      <div className="progressbar-container">
        <div className="progressbar-complete" style={{ width: `${progress}%` }}></div>
        <span className="progress">{progress}%</span>
      </div>
    </div>
  );
};

export default ProgressBar;
