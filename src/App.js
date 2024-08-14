import React, { useState, useCallback } from 'react';
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

  return (
    <div>
      <VideoUploader onVideoUpload={handleFileUpload} />
      {videoFile && (
        <div>
          <VideoPlayer 
            videoFile={videoFile} 
            onTimeUpdate={handleTimeUpdate} 
            onLoadedMetadata={handleLoadedMetadata} 
          />
          <Timeline 
            duration={totalDuration} 
            currentTime={currentTime} 
            frameTimes={frameTimes} 
            onFrameOkuri={handleFrameOkuri}
            onFrameRateChange={handleFrameRateChange} 
          />
        </div>
      )}
    </div>
  );
};

export default App;
