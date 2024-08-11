// VideoPlayer.js
import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ videoFile, onTimeUpdate, onLoadedMetadata, children }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoFile) {
      console.log('useEffect:', videoFile)
      const videoURL = URL.createObjectURL(videoFile);
      const videoElement = videoRef.current;

      videoElement.src = videoURL;

      const handleLoadedMetadata = () => {
        onLoadedMetadata(videoElement.duration);
      };

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        URL.revokeObjectURL(videoURL);
      };
    }
  }, [videoFile, onLoadedMetadata]);

  const handleTimeUpdate = () => {
    const currentTime = videoRef.current.currentTime;
    onTimeUpdate(currentTime);
  };

  return (
    <div>
      <video
        ref={videoRef}
        width="100%"
        controls
        onTimeUpdate={handleTimeUpdate}
      >
        Your browser does not support the video tag.
        {children}
      </video>
    </div>
  );
};

export default VideoPlayer;
