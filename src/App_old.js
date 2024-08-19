import React, { useState, useCallback, useRef } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';

const App = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [frameTimes, setFrameTimes] = useState({
    23.99: [],
    24: [],
    30: [],
  });

  const videoRef = useRef(null);

  const handleFileUpload = (file) => {
    setVideoFile(file);
  };

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const calculateFrameTimes = (frameRate, duration) => {
    const times = [];
    const totalFrames = Math.floor(duration * frameRate);
    for (let i = 0; i <= totalFrames; i++) {
      times.push(i / frameRate);
    }
    return times;
  };

  const handleLoadedMetadata = useCallback((duration) => {
    setTotalDuration(duration);
    setFrameTimes({
      23.99: calculateFrameTimes(23.99, duration),
      24: calculateFrameTimes(24, duration),
      30: calculateFrameTimes(30, duration),
    });
  }, []);

  const handleFrameOkuri = (frameRate, direction) => {
    const times = frameTimes[frameRate];
    let nextTime;

    if (direction === 'forward') {
      const nearestTrueTime = times.reduce((prev, curr) => 
        Math.abs(curr - currentTime) < Math.abs(prev - currentTime) ? curr : prev
      );
      const nearestTrueTimeIndex = times.indexOf(nearestTrueTime);
      nextTime = times[nearestTrueTimeIndex + 1];
    } else if (direction === 'backward') {
      nextTime = [...times].reverse().find(time => time < currentTime);
    }

    if (nextTime !== undefined) {
      const video = document.querySelector('video');
      video.currentTime = nextTime;
    }
  };

  const handleFrameRateChange = (updatedFrameRates) => {
    const newFrameTimes = updatedFrameRates.reduce((acc, frameRate) => {
      acc[frameRate] = calculateFrameTimes(frameRate, totalDuration);
      return acc;
    }, {});
    setFrameTimes(newFrameTimes);
  };

  const handleSaveFrame = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `frame_${currentTime.toFixed(3)}s.png`;
      link.click();
    }
  };

  return (
    <div>
      <VideoUploader onVideoUpload={handleFileUpload} />
      {videoFile && (
        <div>
          <VideoPlayer 
            videoFile={videoFile} 
            onTimeUpdate={handleTimeUpdate} 
            onLoadedMetadata={handleLoadedMetadata}
            videoRef={videoRef} 
          />
          <Timeline 
            duration={totalDuration} 
            currentTime={currentTime} 
            frameTimes={frameTimes} 
            onFrameOkuri={handleFrameOkuri}
            onFrameRateChange={handleFrameRateChange} 
            onSaveFrame={handleSaveFrame}
          />
        </div>
      )}
    </div>
  );
};

export default App;
