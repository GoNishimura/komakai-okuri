import React, { useState, useCallback, useRef, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';

function App() {
    const [videoFile, setVideoFile] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [tickRowsData, setTickRowsData] = useState([]);
    const [startOffset, setStartOffset] = useState(0.001);

    const videoRef = useRef(null);

    const handleFileUpload = (file) => {
        setVideoFile(file);
    };

    const handleTimeUpdate = useCallback((time) => {
        setCurrentTime(time);
    }, []);

    const calculateFrameTimes = (frameRate, duration, offset=startOffset) => {
        const frameTimes = [];
        let time = offset;

        while (time <= duration) {
            frameTimes.push(time);
            time += 1 / frameRate;
        }
        
        return frameTimes;
    };

    const handleLoadedMetadata = (duration) => {
        setTotalDuration(duration);
        const newTickRowsData = tickRowsData.map((tickRow) => ({
            ...tickRow,
            frameTimes: calculateFrameTimes(tickRow.frameRate, duration),
        }));
        setTickRowsData(newTickRowsData)
        const video = document.querySelector('video');
        video.currentTime = startOffset
    };

    const handleFrameOkuri = (frameRate, direction) => {
        const times = tickRowsData.find(row => row.frameRate === frameRate).frameTimes;
        let nextTime;
        
        if (direction === 'forward') {
            const nearestTrueTime = times.reduce((prev, curr) => 
                Math.abs(curr - currentTime) < Math.abs(prev - currentTime) ? curr : prev
            );
            const nearestTrueTimeIndex = times.indexOf(nearestTrueTime);
            nextTime = times[nearestTrueTimeIndex + (startOffset <= currentTime)];
        } else if (direction === 'backward') {
            nextTime = [...times].reverse().find(time => time < currentTime);
            if (nextTime === undefined) nextTime = 0
        }
        
        if (nextTime !== undefined) {
            const video = document.querySelector('video');
            video.currentTime = nextTime;
        }
    };

    const handleFrameRateChange = (updatedFrameRates) => {
        const newTickRowsData = tickRowsData.map((tickRow, index) => ({
            ...tickRow,
            frameRate: updatedFrameRates[index],
            frameTimes: calculateFrameTimes(tickRow.frameRate, totalDuration),
        }));
        setTickRowsData(newTickRowsData);
    };

    const handleStartOffsetChange = (e) => {
        const newOffset = Math.max(0, parseFloat(e.target.value));
        setStartOffset(newOffset);
        const newTickRowsData = tickRowsData.map((tickRow) => ({
            ...tickRow,
            frameTimes: calculateFrameTimes(tickRow.frameRate, totalDuration, newOffset),
        }));
        setTickRowsData(newTickRowsData);
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

    // 新しい動画ファイルの選択時に初期化する
    useEffect(() => {
        if (videoFile) {
            setCurrentTime(0);
            setTotalDuration(0);
            setTickRowsData([
                { frameRate: 23.99, frameTimes: [] },
                { frameRate: 24, frameTimes: [] },
                { frameRate: 30, frameTimes: [] }
            ]);
            videoRef.current.load(); // 新しい動画をロード
        }
    }, [videoFile]);

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
                    <div className="player-supporter">
                        <label>
                            コマ開始時点:
                            <input
                                type="number"
                                value={startOffset}
                                onChange={handleStartOffsetChange}
                                step="0.001"
                                min="0"
                                style={{ width: '4em' }}
                                />秒
                        </label>
                        <div>{currentTime.toFixed(3)} 秒</div>
                        <button onClick={handleSaveFrame}>このコマを保存</button>
                    </div>
                    <Timeline
                        duration={totalDuration}
                        currentTime={currentTime}
                        tickRowsData={tickRowsData}
                        onFrameOkuri={handleFrameOkuri}
                        onFrameRateChange={handleFrameRateChange}
                        startOffset={startOffset}
                    />
                </div>
            )}
            <style jsx="true">{`
                .player-supporter {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
            `}</style>
        </div>
    );
}

export default App;
