import React, { useState, useCallback, useRef, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import { time2FrameIndex } from './utils.js';

function App() {
    const [videoFile, setVideoFile] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [layersData, setLayersData] = useState([]);
    const [startOffset, setStartOffset] = useState(0.001);

    const videoRef = useRef(null);

    const handleFileUpload = (file) => {
        setVideoFile(file);
    };

    const handleTimeUpdate = useCallback((time) => {
        setCurrentTime(time);
    }, []);

    const calculateFrameTimes = (frameRate, duration, offset = startOffset) => {
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
        const newlayersData = layersData.map((layer) => ({
            ...layer,
            frameTimes: calculateFrameTimes(layer.frameRate, duration),
            bookmarkedFrames: [],
        }));
        setLayersData(newlayersData);
        const video = document.querySelector('video');
        video.currentTime = startOffset;
    };

    const handleFrameOkuri = (frameRate, direction) => {
        const times = layersData.find(row => row.frameRate === frameRate).frameTimes;
        let nextTime;

        const nextIndex = time2FrameIndex(currentTime, frameRate, startOffset) + (direction === 'forward' ? 1 : -1);
        if (nextIndex >= times.length || nextIndex < 0) return;
        nextTime = times[Math.max(nextIndex, 0)];
        const video = document.querySelector('video');
        video.currentTime = nextTime;
    };

    const handleBookmarkToggle = (layerIndex) => {
        const newlayersData = [...layersData];
        const bookmarkedFrames = newlayersData[layerIndex].bookmarkedFrames;
        const currentFrameIndex = time2FrameIndex(currentTime, layersData[layerIndex].frameRate, startOffset);
        if (currentFrameIndex < 0) return;

        if (bookmarkedFrames.includes(currentFrameIndex)) {
            newlayersData[layerIndex].bookmarkedFrames = bookmarkedFrames.filter(index => index !== currentFrameIndex);
        } else {
            newlayersData[layerIndex].bookmarkedFrames = [...bookmarkedFrames, currentFrameIndex].sort((a, b) => a - b);
        }
        setLayersData(newlayersData);
    };

    const handleBookmarkFrameOkuri = (layerIndex, direction) => {
        const layer = layersData[layerIndex];
        if (layer.bookmarkedFrames.length === 0) return;
        let nextTime;

        const currentFrameIndex = time2FrameIndex(currentTime, layer.frameRate, startOffset);
        if (direction === 'forward') {
            const nextIndex = layer.bookmarkedFrames.find(index => index > currentFrameIndex);
            nextTime = layer.frameTimes[nextIndex];
        } else if (direction === 'backward') {
            const prevIndex = [...layer.bookmarkedFrames].reverse().find(index => index < currentFrameIndex);
            nextTime = layer.frameTimes[prevIndex];
        }

        if (nextTime !== undefined) {
            const video = document.querySelector('video');
            video.currentTime = nextTime;
        }
    };

    const handleFrameRateChange = (updatedFrameRates) => {
        const newlayersData = layersData.map((layer, index) => ({
            ...layer,
            frameRate: updatedFrameRates[index],
            frameTimes: calculateFrameTimes(updatedFrameRates[index], totalDuration),
        }));
        setLayersData(newlayersData);
    };

    const handleStartOffsetChange = (e) => {
        const newOffset = Math.max(0, parseFloat(e.target.value));
        setStartOffset(newOffset);
        const newlayersData = layersData.map((layer) => ({
            ...layer,
            frameTimes: calculateFrameTimes(layer.frameRate, totalDuration, newOffset),
        }));
        setLayersData(newlayersData);
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

    const addLayer = () => {
        if (layersData.length > 0) {
            const lastLayer = layersData[layersData.length - 1];
            const newLayer = {
                ...lastLayer,
                frameTimes: [...lastLayer.frameTimes],
                bookmarkedFrames: [...lastLayer.bookmarkedFrames],
            };
            setLayersData([...layersData, newLayer]);
        } else {
            const newLayer = {
                frameRate: 24,
                frameTimes: calculateFrameTimes(24, totalDuration, startOffset),
                bookmarkedFrames: [],
            };
            setLayersData([newLayer]);
        }
    };

    const removeLayer = (index) => {
        const newlayersData = layersData.filter((_, i) => i !== index);
        setLayersData(newlayersData);
    };

    const moveLayer = (index, direction) => {
        const newLayersData = [...layersData];
        if (direction === 'up' && index > 0) {
            [newLayersData[index], newLayersData[index - 1]] = [newLayersData[index - 1], newLayersData[index]];
        } else if (direction === 'down' && index < newLayersData.length - 1) {
            [newLayersData[index], newLayersData[index + 1]] = [newLayersData[index + 1], newLayersData[index]];
        }
        setLayersData(newLayersData);
    };

    useEffect(() => {
        if (videoFile) {
            setCurrentTime(0);
            setTotalDuration(0);
            setLayersData([
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
                        layersData={layersData}
                        onFrameOkuri={handleFrameOkuri}
                        onFrameRateChange={handleFrameRateChange}
                        startOffset={startOffset}
                        onBookmarkToggle={handleBookmarkToggle}
                        onBookmarkFrameOkuri={handleBookmarkFrameOkuri}
                        onRemoveLayer={removeLayer}
                        onMoveLayer={moveLayer}
                    />
                    <button onClick={addLayer}>画層を追加</button>
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
