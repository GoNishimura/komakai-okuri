import React, { useState } from 'react';

function Timeline({ duration, currentTime, onFrameOkuri, frameTimes }) {
  const [frameRates, setFrameRates] = useState([23.97, 24, 30]);

  const handleFrameOkuri = (frameRate, direction) => {
    onFrameOkuri(frameRate, direction);
  };

  return (
    <div className="timeline-container">
      {frameRates.map((frameRate, index) => (
        <div key={index} className="timeline">
          <div className="timeline-header">
            <input 
              type="number" 
              value={frameRate} 
              onChange={(e) => {
                const updatedFrameRates = [...frameRates];
                updatedFrameRates[index] = parseFloat(e.target.value);
                setFrameRates(updatedFrameRates);
              }} 
              style={{ width: '4em' }} // 横幅を調整
            />
            <span>コマ/秒（FPS）</span>
            <button onClick={() => handleFrameOkuri(frameRate, 'backward')}>⟸</button>
            <button onClick={() => handleFrameOkuri(frameRate, 'forward')}>⟹</button>
          </div>
          <div className="timeline-body">
            {frameTimes[frameRate].map((time, i) => (
              <div
                key={i}
                className="frame-tick"
                style={{ left: `${(time / duration) * 100}%` }}
              />
            ))}
            <div
              className="current-time-indicator"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <style jsx="true">{`
        .timeline-container {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .timeline {
          position: relative;
          height: 40px; /* 高さを調整 */
          background-color: #ddd;
          margin-bottom: 5px;
        }
        .timeline-header {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding-bottom: 4px; /* 余裕を持たせる */
        }
        .timeline-body {
          position: relative;
          height: 20px;
          background-color: #eee;
        }
        .frame-tick {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: #000;
        }
        .current-time-indicator {
          position: absolute;
          top: 0; /* タイムラインボディに合わせる */
          bottom: 0;
          width: 2px;
          background-color: red;
        }
      `}</style>
    </div>
  );
}

export default Timeline;
