// VideoUploader.js
import React from 'react';

const VideoUploader = ({ onVideoUpload }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    onVideoUpload(file);
  };

  return (
    <div>
      <input type="file" accept="video/*" onChange={handleFileChange} />
    </div>
  );
};

export default VideoUploader;
