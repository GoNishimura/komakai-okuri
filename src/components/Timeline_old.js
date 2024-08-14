import React, { useEffect, useState } from 'react';

function Timeline({ duration, currentTime, frameTimes, onFrameOkuri, onFrameRateChange }) {
    const [frameRates, setFrameRates] = useState([23.99, 24, 30]);

    const handleFrameRateChange = (index, newFrameRate) => {
        const updatedFrameRates = [...frameRates];
        updatedFrameRates[index] = parseFloat(newFrameRate);
        setFrameRates(updatedFrameRates);
        onFrameRateChange(updatedFrameRates);  // App.js に新しいフレームレートを伝える
    };

    const formatTime = (timeInSeconds) => {
      const ms = Math.floor((timeInSeconds % 1) * 1000);
      const s = Math.floor(timeInSeconds) % 60;
      return `${s}.${ms}`;
    };

    const calculateFrameNumber = (time, frameRate) => {
      return (time * frameRate).toFixed(3);
    };

    return (
        <div className="timeline-container">
          <div className="timeline-header">
            <div>{formatTime(currentTime)} 秒</div>
          </div>
          <div className="timeline-body">
            {frameRates.map((frameRate, index) => (
                <div key={index} className="timeline-row">
                    <div className="timeline-row-header">
                        <input 
                            type="number" 
                            value={frameRate} 
                            onChange={(e) => handleFrameRateChange(index, e.target.value)} 
                            style={{ width: '4em' }}
                        /> コマ/秒（FPS）
                        <button onClick={() => onFrameOkuri(frameRate, 'backward')}>←</button>
                        <button onClick={() => onFrameOkuri(frameRate, 'forward')}>→</button>
                        <span>{calculateFrameNumber(currentTime, frameRate)} コマ目</span>
                    </div>
                    <div className="timeline-row-body">
                        {frameTimes[frameRate] && frameTimes[frameRate].map((time, i) => (
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
                .timeline-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                .timeline-body {
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }
                .timeline-row {
                    position: relative;
                    margin-bottom: 5px;
                }
                .timeline-row-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 5px;
                }
                .timeline-row-body {
                    position: relative;
                    height: 20px;
                    background-color: #ddd;
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
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background-color: red;
                }
            `}</style>
          </div>
        </div>
    );
}

export default Timeline;
