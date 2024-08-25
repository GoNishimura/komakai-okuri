import React, { useEffect, useState } from 'react';

function Timeline({ duration, currentTime, tickRowsData, onFrameOkuri, onFrameRateChange }) {
    const [frameRates, setFrameRates] = useState(tickRowsData.map(row => row.frameRate));

    useEffect(() => {
        const newFrameRates = tickRowsData.map(row => row.frameRate);
        if (JSON.stringify(frameRates) !== JSON.stringify(newFrameRates)) {
            setFrameRates(newFrameRates);
        }
    }, [tickRowsData, frameRates]);

    const handleFrameRateChange = (index, newFrameRate) => {
        const updatedFrameRates = [...frameRates];
        updatedFrameRates[index] = parseFloat(newFrameRate);
        setFrameRates(updatedFrameRates);
        onFrameRateChange(updatedFrameRates);
    };

    const calculateFrameNumber = (time, frameRate) => {
        return (time * frameRate).toFixed(3);
    };

    const handleClickOnFrame = (e, frameRate) => {
        const timelineRowBody = e.currentTarget;
        const clickPosition = e.clientX - timelineRowBody.getBoundingClientRect().left;
        const clickTime = (clickPosition / timelineRowBody.offsetWidth) * duration;
        const nearestPreviousTime = tickRowsData
            .find(row => row.frameRate === frameRate)
            .frameTimes[Math.floor(calculateFrameNumber(clickTime, frameRate))];
        const video = document.querySelector('video');
        if (video) {
            video.currentTime = nearestPreviousTime;
        }
    };

    return (
        <div className="timeline-container">
            {tickRowsData.map((tickRow, index) => (
                <div key={index} className="timeline-row">
                    <div className="timeline-row-header">
                        <input
                            type="number"
                            value={tickRow.frameRate}
                            onChange={(e) => handleFrameRateChange(index, e.target.value)}
                            style={{ width: '4em' }}
                        /> コマ/秒（FPS）
                        <button onClick={() => onFrameOkuri(tickRow.frameRate, 'backward')}>←</button>
                        <button onClick={() => onFrameOkuri(tickRow.frameRate, 'forward')}>→</button>
                        <span>{calculateFrameNumber(currentTime, tickRow.frameRate)} コマ目</span>
                    </div>
                    <div 
                        className="timeline-row-body" 
                        onClick={(e) => handleClickOnFrame(e, tickRow.frameRate)}
                    >
                        {tickRow.frameTimes.map((time, i) => (
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
                    cursor: pointer;
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
    );
}

export default Timeline;
