// src/components/VideoPlayer.js
import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ file }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (file) {
      const objectURL = URL.createObjectURL(file);
      videoRef.current.src = objectURL;

      return () => {
        URL.revokeObjectURL(objectURL);
      };
    }
  }, [file]);

  return (
    <div>
      <video ref={videoRef} controls width="600" />
    </div>
  );
};

export default VideoPlayer;
