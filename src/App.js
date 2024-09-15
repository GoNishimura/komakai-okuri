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
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
    const [colorPalette, setColorPalette] = useState({ selectedLayer: '#00FFFF', bookmark: '#00FF00', currentTimeIndicator: '#FF0000' });
    const [shortcuts, setShortcuts] = useState({
        playPause: 'Space',
        nextFrame: 'd',
        prevFrame: 'a',
        toggleBookmark: 'f',
        nextBookmark: 'e',
        prevBookmark: 'q',
        selectUp: 'ArrowUp',
        selectDown: 'ArrowDown',
        layerUp: '[',
        layerDown: ']',
        saveFrame: 'p',
    });

    const videoRef = useRef(null);

    const handleFileUpload = (file) => {
        setVideoFile(file);
    };

    const handleTimeUpdate = useCallback((time) => {
        setCurrentTime(time);
    }, []);

    const calculateFrameTimes = useCallback((frameRate, duration, offset = startOffset) => {
        const frameTimes = [];
        let time = offset;

        while (time <= duration) {
            frameTimes.push(time);
            time += 1 / frameRate;
        }

        return frameTimes;
    }, [startOffset]);

    const handleLoadedMetadata = (duration) => {
        setTotalDuration(duration);
        const newLayersData = layersData.map((layer) => ({
            ...layer,
            frameTimes: calculateFrameTimes(layer.frameRate, duration),
            bookmarkedFrames: [],
        }));
        setLayersData(newLayersData);
        const video = document.querySelector('video');
        video.currentTime = startOffset;
    };

    const handleFrameOkuri = useCallback((layerIndex, direction) => {
        setSelectedLayerIndex(layerIndex);
        const times = layersData[layerIndex].frameTimes;
        let nextTime;

        const nextIndex = time2FrameIndex(currentTime, layersData[layerIndex].frameRate, startOffset) + (direction === 'forward' ? 1 : -1);
        if (nextIndex >= times.length || nextIndex < 0) return;
        nextTime = times[Math.max(nextIndex, 0)];
        const video = document.querySelector('video');
        video.currentTime = nextTime;
    }, [currentTime, layersData, startOffset]);

    const handleBookmarkToggle = useCallback((layerIndex) => {
        setSelectedLayerIndex(layerIndex);
        const newLayersData = [...layersData];
        const bookmarkedFrames = newLayersData[layerIndex].bookmarkedFrames;
        const currentFrameIndex = time2FrameIndex(currentTime, layersData[layerIndex].frameRate, startOffset);
        if (currentFrameIndex < 0) return;

        if (bookmarkedFrames.includes(currentFrameIndex)) {
            newLayersData[layerIndex].bookmarkedFrames = bookmarkedFrames.filter(index => index !== currentFrameIndex);
        } else {
            newLayersData[layerIndex].bookmarkedFrames = [...bookmarkedFrames, currentFrameIndex].sort((a, b) => a - b);
        }
        setLayersData(newLayersData);
    }, [currentTime, layersData, startOffset]);

    const handleBookmarkFrameOkuri = useCallback((layerIndex, direction) => {
        setSelectedLayerIndex(layerIndex);
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
    }, [currentTime, layersData, startOffset]);

    const handleFrameRateChange = useCallback((layerIndex, newFrameRate) => {
        const newLayersData = [...layersData]
        newLayersData[layerIndex].frameRate = newFrameRate
        newLayersData[layerIndex].frameTimes = calculateFrameTimes(newFrameRate, totalDuration)
        setLayersData(newLayersData);
    }, [layersData, totalDuration, calculateFrameTimes]);

    const handleStartOffsetChange = (e) => {
        const newOffset = Math.max(0, parseFloat(e.target.value));
        setStartOffset(newOffset);
        const newLayersData = layersData.map((layer) => ({
            ...layer,
            frameTimes: calculateFrameTimes(layer.frameRate, totalDuration, newOffset),
        }));
        setLayersData(newLayersData);
    };

    const handleSaveFrame = useCallback(() => {
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
    }, [currentTime]);

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

    const removeLayer = (layerIndex) => {
        const newLayersData = layersData.filter((_, i) => i !== layerIndex);
        setLayersData(newLayersData);
        setSelectedLayerIndex(Math.max(layerIndex - 1, 0));
    };

    const moveLayer = useCallback((layerIndex, direction) => {
        const newLayersData = [...layersData];
        if (direction === 'up' && layerIndex > 0) {
            setSelectedLayerIndex(layerIndex - 1);
            [newLayersData[layerIndex], newLayersData[layerIndex - 1]] = [newLayersData[layerIndex - 1], newLayersData[layerIndex]];
        } else if (direction === 'down' && layerIndex < newLayersData.length - 1) {
            setSelectedLayerIndex(layerIndex + 1);
            [newLayersData[layerIndex], newLayersData[layerIndex + 1]] = [newLayersData[layerIndex + 1], newLayersData[layerIndex]];
        }
        setLayersData(newLayersData);
    }, [layersData]);

    const toggleSettingsMenu = () => {
        setShowSettingsMenu(!showSettingsMenu);
    };

    const handleColorPaletteChange = (action, newColor) => {
        setColorPalette((prevColors) => ({
            ...prevColors,
            [action]: newColor
        }));
    };

    const handleShortcutChange = (action, newShortcut) => {
        setShortcuts((prevShortcuts) => ({
            ...prevShortcuts,
            [action]: newShortcut,
        }));
    };

    const handleSelectedLayerChanged = (layerIndex) => {
        setSelectedLayerIndex(layerIndex);
    }

    useEffect(() => {
        const handleKeyDown = (event) => {
            console.log(event.key)
            if (event.key === shortcuts.playPause) {
                const video = document.querySelector('video');
                if (video.paused) video.play();
                else video.pause();
            } else if (event.key === shortcuts.nextFrame) {
                handleFrameOkuri(selectedLayerIndex, 'forward');
            } else if (event.key === shortcuts.prevFrame) {
                handleFrameOkuri(selectedLayerIndex, 'backward');
            } else if (event.key === shortcuts.toggleBookmark) {
                handleBookmarkToggle(selectedLayerIndex);
            } else if (event.key === shortcuts.nextBookmark) {
                handleBookmarkFrameOkuri(selectedLayerIndex, 'forward');
            } else if (event.key === shortcuts.prevBookmark) {
                handleBookmarkFrameOkuri(selectedLayerIndex, 'backward');
            } else if (event.key === shortcuts.selectUp) {
                handleSelectedLayerChanged(Math.max(selectedLayerIndex - 1, 0));
            } else if (event.key === shortcuts.selectDown) {
                handleSelectedLayerChanged(Math.min(selectedLayerIndex + 1, layersData.length - 1));
            } else if (event.key === shortcuts.layerUp) {
                moveLayer(selectedLayerIndex, 'up');
            } else if (event.key === shortcuts.layerDown) {
                moveLayer(selectedLayerIndex, 'down');
            } else if (event.key === shortcuts.saveFrame) {
                handleSaveFrame();
            } else if (!isNaN(event.key)) {
                const selectedIndex = parseInt(event.key) - 1;
                if (0 <= selectedIndex && selectedIndex < layersData.length) setSelectedLayerIndex(selectedIndex);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, layersData, selectedLayerIndex, handleFrameOkuri, handleBookmarkToggle, handleBookmarkFrameOkuri, moveLayer, handleSaveFrame]);

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
                        <button 
                            onClick={handleSaveFrame}
                            onMouseEnter={(e) => e.target.setAttribute('title', shortcuts.saveFrame)}
                        >
                        このコマを保存</button>
                    </div>
                    <Timeline
                        duration={totalDuration}
                        currentTime={currentTime}
                        layersData={layersData}
                        startOffset={startOffset}
                        colorPalette={colorPalette}
                        selectedLayerIndex={selectedLayerIndex}
                        shortcuts={shortcuts}
                        onFrameOkuri={handleFrameOkuri}
                        onFrameRateChange={handleFrameRateChange}
                        onBookmarkToggle={handleBookmarkToggle}
                        onBookmarkFrameOkuri={handleBookmarkFrameOkuri}
                        onRemoveLayer={removeLayer}
                        onMoveLayer={moveLayer}
                        onSelectedLayerChange={handleSelectedLayerChanged}
                    />
                    <button onClick={addLayer}>画層を追加</button>
                </div>
            )}
            
            <button onClick={toggleSettingsMenu}>{showSettingsMenu ? '設定を閉じる' : '設定を開く'}</button>
            {showSettingsMenu && (
                <div className="settings-menu">
                    <h3>設定</h3>
                    <label>
                        再生位置:
                        <input type="color" value={colorPalette.currentTimeIndicator} onChange={(e) => handleColorPaletteChange('currentTimeIndicator', e.target.value)} />
                    </label>
                    <label>
                        枝折り:
                        <input type="color" value={colorPalette.bookmark} onChange={(e) => handleColorPaletteChange('bookmark', e.target.value)} />
                    </label>
                    <label>
                        選択中の画層:
                        <input type="color" value={colorPalette.selectedLayer} onChange={(e) => handleColorPaletteChange('selectedLayer', e.target.value)} />
                    </label>
                    <div>
                        <h4>ショートカットキー設定</h4>
                        <label>
                            再生/一時停止:
                            <input
                                type="text"
                                value={shortcuts.playPause}
                                onChange={(e) => handleShortcutChange('playPause', e.target.value)}
                            />
                        </label>
                        <label>
                            次のコマ:
                            <input
                                type="text"
                                value={shortcuts.nextFrame}
                                onChange={(e) => handleShortcutChange('nextFrame', e.target.value)}
                            />
                        </label>
                        <label>
                            前のコマ:
                            <input
                                type="text"
                                value={shortcuts.prevFrame}
                                onChange={(e) => handleShortcutChange('prevFrame', e.target.value)}
                            />
                        </label>
                        <label>
                            枝折り登録・解除:
                            <input
                                type="text"
                                value={shortcuts.toggleBookmark}
                                onChange={(e) => handleShortcutChange('toggleBookmark', e.target.value)}
                            />
                        </label>
                        <label>
                            次の枝折りコマ:
                            <input
                                type="text"
                                value={shortcuts.nextBookmark}
                                onChange={(e) => handleShortcutChange('nextBookmark', e.target.value)}
                            />
                        </label>
                        <label>
                            前の枝折りコマ:
                            <input
                                type="text"
                                value={shortcuts.prevBookmark}
                                onChange={(e) => handleShortcutChange('prevBookmark', e.target.value)}
                            />
                        </label>
                        <label>
                            選択を上へ:
                            <input
                                type="text"
                                value={shortcuts.selectUp}
                                onChange={(e) => handleShortcutChange('selectUp', e.target.value)}
                            />
                        </label>
                        <label>
                            選択を下へ:
                            <input
                                type="text"
                                value={shortcuts.selectDown}
                                onChange={(e) => handleShortcutChange('selectDown', e.target.value)}
                            />
                        </label>
                        <label>
                            画層を上へ:
                            <input
                                type="text"
                                value={shortcuts.layerUp}
                                onChange={(e) => handleShortcutChange('layerUp', e.target.value)}
                            />
                        </label>
                        <label>
                            画層を下へ:
                            <input
                                type="text"
                                value={shortcuts.layerDown}
                                onChange={(e) => handleShortcutChange('layerDown', e.target.value)}
                            />
                        </label>
                        <label>
                            現在のコマを保存:
                            <input
                                type="text"
                                value={shortcuts.saveFrame}
                                onChange={(e) => handleShortcutChange('saveFrame', e.target.value)}
                            />
                        </label>
                    </div>
                    <div>
                        <label>
                            N番目の画層を選択: 数字キー
                        </label>
                    </div>
                </div>
            )}

            <style jsx="true">{`
                .player-supporter {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                .settings-menu {
                    margin-top: 20px;
                    padding: 10px;
                    border: 1px solid #ccc;
                    background-color: #f9f9f9;
                }
            `}</style>
        </div>
    );
}

export default App;
