import React, { useState, useCallback, useRef, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import { time2FrameIndex } from './utils.js';


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
            bookmarkedFrames: [], // 新たに追加
        }));
        setTickRowsData(newTickRowsData);
        const video = document.querySelector('video');
        video.currentTime = startOffset;
    };

    const handleFrameOkuri = (frameRate, direction) => {
        const times = tickRowsData.find(row => row.frameRate === frameRate).frameTimes;
        let nextTime;
        
        const nextIndex = time2FrameIndex(currentTime, frameRate, startOffset) + (direction === 'forward' ? 1 : -1);
        if (nextIndex >= times.length || nextIndex < 0) return;
        nextTime = times[Math.max(nextIndex, 0)];
        const video = document.querySelector('video');
        video.currentTime = nextTime;
    };

    const handleBookmarkToggle = (tickRowIndex) => {
        const newTickRowsData = [...tickRowsData];
        const bookmarkedFrames = newTickRowsData[tickRowIndex].bookmarkedFrames;
        const currentFrameIndex = time2FrameIndex(currentTime, tickRowsData[tickRowIndex].frameRate, startOffset);
        if (currentFrameIndex < 0) return;

        if (bookmarkedFrames.includes(currentFrameIndex)) {
            newTickRowsData[tickRowIndex].bookmarkedFrames = bookmarkedFrames.filter(index => index !== currentFrameIndex);
        } else {
            newTickRowsData[tickRowIndex].bookmarkedFrames = [...bookmarkedFrames, currentFrameIndex].sort((a, b) => a - b);
        }
        setTickRowsData(newTickRowsData);
    };

    const handleBookmarkFrameOkuri = (tickRowIndex, direction) => {
        const tickRow = tickRowsData[tickRowIndex];
        if (tickRow.bookmarkedFrames.length === 0) return;
        let nextTime;

        const currentFrameIndex = time2FrameIndex(currentTime, tickRow.frameRate, startOffset);
        if (direction === 'forward') {
            const nextIndex = tickRow.bookmarkedFrames.find(index => index > currentFrameIndex);
            nextTime = tickRow.frameTimes[nextIndex];
        } else if (direction === 'backward') {
            const prevIndex = [...tickRow.bookmarkedFrames].reverse().find(index => index < currentFrameIndex);
            nextTime = tickRow.frameTimes[prevIndex];
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
            frameTimes: calculateFrameTimes(updatedFrameRates[index], totalDuration),
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

    useEffect(() => {
        if (videoFile) {
            setCurrentTime(0);
            setTotalDuration(0);
            setTickRowsData([
                { frameRate: 23.99, frameTimes: [], bookmarkedFrames: [] },
                { frameRate: 24, frameTimes: [], bookmarkedFrames: [] },
                { frameRate: 30, frameTimes: [], bookmarkedFrames: [] }
            ]);
            videoRef.current.load();
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
                        <div>{currentTime.toFixed(3)} / {totalDuration.toFixed(3)}秒</div>
                        <button onClick={handleSaveFrame}>このコマを保存</button>
                    </div>
                    <Timeline
                        duration={totalDuration}
                        currentTime={currentTime}
                        tickRowsData={tickRowsData}
                        onFrameOkuri={handleFrameOkuri}
                        onFrameRateChange={handleFrameRateChange}
                        startOffset={startOffset}
                        onBookmarkToggle={handleBookmarkToggle}
                        onBookmarkFrameOkuri={handleBookmarkFrameOkuri}
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
