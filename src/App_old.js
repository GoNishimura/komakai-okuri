import React, { useState, useCallback, useRef, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';

const App = () => {
    const [videoFile, setVideoFile] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [tickRowsData, setTickRowsData] = useState([
        { frameRate: 23.99, frameTimes: [] },
        { frameRate: 24, frameTimes: [] },
        { frameRate: 30, frameTimes: [] }
    ]);

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
        setTickRowsData((prevTickRows) =>
            prevTickRows.map((tickRow) => ({
                ...tickRow,
                frameTimes: calculateFrameTimes(tickRow.frameRate, duration),
            }))
        );
    }, []);

    const handleFrameOkuri = (frameRate, direction) => {
        const times = tickRowsData.find(row => row.frameRate === frameRate).frameTimes;
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
        const newTickRowsData = updatedFrameRates.map((frameRate) => ({
            frameRate,
            frameTimes: calculateFrameTimes(frameRate, totalDuration),
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
                        <div>{currentTime.toFixed(3)} 秒</div>
                        <button onClick={handleSaveFrame}>このコマを保存</button>
                    </div>
                    <Timeline 
                        duration={totalDuration} 
                        currentTime={currentTime} 
                        tickRowsData={tickRowsData} 
                        onFrameOkuri={handleFrameOkuri}
                        onFrameRateChange={handleFrameRateChange} 
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
};

export default App;
