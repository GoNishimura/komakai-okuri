import React, { useState, useCallback } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';

const App = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [frameTimes, setFrameTimes] = useState({
    23.97: [],
    24: [],
    30: [],
  });

  const handleFileUpload = (file) => {
    setVideoFile(file);
  };

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
    console.log('currentTime:', time);
  }, []);

  const handleLoadedMetadata = useCallback((duration) => {
    setTotalDuration(duration);
    console.log('duration:', duration);

    const calculateFrameTimes = (frameRate) => {
      const times = [];
      const totalFrames = Math.floor(duration * frameRate);
      for (let i = 0; i <= totalFrames; i++) {
        times.push((i / frameRate));
      }
      return times;
    };

    setFrameTimes({
      23.97: calculateFrameTimes(23.97),
      24: calculateFrameTimes(24),
      30: calculateFrameTimes(30),
    });
  }, []);

  const handleFrameOkuri = (frameRate, direction) => {
    const times = frameTimes[frameRate];
    let nextTime;
  
    if (direction === 'forward') {
      // currentTimeに最も近い時間を探す
      const nearestTrueTime = times.reduce((prev, curr) => 
        Math.abs(curr - currentTime) < Math.abs(prev - currentTime) ? curr : prev
      );
  
      // nearestTrueTimeの次の時間を探す
      const nearestTrueTimeIndex = times.indexOf(nearestTrueTime);
      nextTime = times[nearestTrueTimeIndex + 1];
    } else if (direction === 'backward') {
      nextTime = [...times].reverse().find(time => time < currentTime);
    }
    console.log('times:', times, 'currentTime:', currentTime, 'nextTime:', nextTime);
  
    if (nextTime !== undefined) {
      const video = document.querySelector('video');
      video.currentTime = nextTime;
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
          />
          <Timeline 
            duration={totalDuration} 
            currentTime={currentTime} 
            onFrameOkuri={handleFrameOkuri} 
            frameTimes={frameTimes} 
          />
        </div>
      )}
    </div>
  );
};

export default App;
