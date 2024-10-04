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
    const [isCrosshairVisible, setIsCrosshairVisible] = useState(false);
    const [skipTime, setSkipTime] = useState(10);
    const [colorPalette, setColorPalette] = useState({ 
        selectedLayer: '#00FF00', bookmark: '#00FFFF', currentTimeIndicator: '#FF0000', crosshair: '#FF0000',
    });
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
        saveData: 'S',
        toggleCrosshair: 'g',
        halfSpeed: 'j',
        normalSpeed: 'k',
        twiceSpeed: 'l',
        skipForward: 't',
        skipBackward: 'r',
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

    const handleSaveFrame = useCallback(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            if (isCrosshairVisible) {
                ctx.beginPath();
                ctx.moveTo(0, canvas.height / 2);
                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(canvas.width / 2, canvas.height);
                ctx.strokeStyle = colorPalette.crosshair;
                ctx.stroke();
                ctx.strokeRect(0, 0, canvas.width, canvas.height);
            }
            const dataURL = canvas.toDataURL('image/jpg');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `${videoFile.name}_${currentTime.toFixed(3)}s.jpg`;
            link.click();
        }
    }, [currentTime, isCrosshairVisible, colorPalette, videoFile]);

    const saveDataToFile = useCallback(() => {
        const data = {
            layersData,
            startOffset,
            colorPalette,
            shortcuts,
        };
        const fileName = videoFile.name + ".json";
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
    }, [colorPalette, layersData, shortcuts, startOffset, videoFile]);

    const loadDataFromFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const data = JSON.parse(reader.result);
            setLayersData(data.layersData);
            setStartOffset(data.startOffset);
            setColorPalette(data.colorPalette);
            setShortcuts(data.shortcuts);
        };
        reader.readAsText(file);
    };

    const toggleSettingsMenu = () => {
        setShowSettingsMenu(!showSettingsMenu);
    };

    const handleColorPaletteChange = (action, newColor) => {
        setColorPalette((prevColors) => ({
            ...prevColors,
            [action]: newColor
        }));
    };

    const handleToggleCrosshair = useCallback(() => {
        setIsCrosshairVisible(!isCrosshairVisible);
    }, [isCrosshairVisible]);

    const handleShortcutChange = (action, newShortcut) => {
        setShortcuts((prevShortcuts) => ({
            ...prevShortcuts,
            [action]: newShortcut,
        }));
    };

    const handleSelectedLayerChanged = (layerIndex) => {
        setSelectedLayerIndex(layerIndex);
    };

    const handleSpeedChange = useCallback ((speedRate) => {
        const video = document.querySelector('video');
        video.playbackRate = speedRate;
    }, []);

    const handleSkip = useCallback ((direction) => {
        const video = document.querySelector('video');
        video.currentTime = currentTime + (direction === 'forward' ? skipTime : -skipTime);
    }, [currentTime, skipTime]);

    useEffect(() => {
        const handleKeyDown = (event) => {
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
            } else if (event.key === shortcuts.saveData) {
                saveDataToFile();
            } else if (event.key === shortcuts.toggleCrosshair) {
                handleToggleCrosshair();
            } else if (event.key === shortcuts.halfSpeed) {
                handleSpeedChange(0.5);
            } else if (event.key === shortcuts.normalSpeed) {
                handleSpeedChange(1);
            } else if (event.key === shortcuts.twiceSpeed) {
                handleSpeedChange(2);
            } else if (event.key === shortcuts.skipForward) {
                handleSkip('forward');
            } else if (event.key === shortcuts.skipBackward) {
                handleSkip('backward');
            } else if (!isNaN(event.key)) {
                const selectedIndex = parseInt(event.key) - 1;
                if (0 <= selectedIndex && selectedIndex < layersData.length) setSelectedLayerIndex(selectedIndex);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, layersData, selectedLayerIndex, handleFrameOkuri, handleBookmarkToggle, handleBookmarkFrameOkuri, moveLayer, handleSaveFrame, saveDataToFile, handleToggleCrosshair, handleSpeedChange, handleSkip]);

    useEffect(() => {
        if (videoFile) {
            setCurrentTime(0);
            setTotalDuration(0);
            setLayersData([
                { frameRate: 24, frameTimes: [], bookmarkedFrames: [] },
                { frameRate: 23.99, frameTimes: [], bookmarkedFrames: [] },
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
                        videoRef={videoRef}
                        isCrosshairVisible={isCrosshairVisible} 
                        colorPalette={colorPalette}
                        onTimeUpdate={handleTimeUpdate} 
                        onLoadedMetadata={handleLoadedMetadata} 
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
                        <button 
                            onClick={handleToggleCrosshair}
                            onMouseEnter={(e) => e.target.setAttribute('title', shortcuts.toggleCrosshair)}
                            >
                            十字{isCrosshairVisible ? '非表示' : '表示'}</button>
                        <div>
                            <button 
                                onClick={() => handleSpeedChange(0.5)}
                                onMouseEnter={(e) => e.target.setAttribute('title', shortcuts.halfSpeed)}
                                >
                                半速</button>
                            <button 
                                onClick={() => handleSpeedChange(1)}
                                onMouseEnter={(e) => e.target.setAttribute('title', shortcuts.normalSpeed)}
                                >
                                等速</button>
                            <button 
                                onClick={() => handleSpeedChange(2)}
                                onMouseEnter={(e) => e.target.setAttribute('title', shortcuts.twiceSpeed)}
                                >
                                倍速</button>
                        </div>
                        <div>
                            <input
                                type="number"
                                value={skipTime}
                                onChange={(e) => setSkipTime(e.target.value)}
                                style={{ width: '4em' }}
                            />秒
                            <button 
                                onClick={() => handleSkip('backward')}
                                onMouseEnter={(e) => e.target.setAttribute('title', shortcuts.skipBackward)}
                                >
                                後へ</button>
                            <button 
                                onClick={() => handleSkip('forward')}
                                onMouseEnter={(e) => e.target.setAttribute('title', shortcuts.halfSpeed)}
                                >
                                先へ</button>
                        </div>
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

            {videoFile && (
                <button onClick={toggleSettingsMenu}>{showSettingsMenu ? '設定を閉じる' : '設定を開く'}</button>
            )}
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
                    <label>
                        十字線:
                        <input type="color" value={colorPalette.crosshair} onChange={(e) => handleColorPaletteChange('crosshair', e.target.value)} />
                    </label>
                    <div>
                        <h4>ショートカットキー設定</h4>
                        <label>
                            再生/一時停止:
                            <input
                                type="text"
                                value={shortcuts.playPause}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('playPause', e.target.value)}
                            />
                        </label>
                        <label>
                            次のコマ:
                            <input
                                type="text"
                                value={shortcuts.nextFrame}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('nextFrame', e.target.value)}
                            />
                        </label>
                        <label>
                            前のコマ:
                            <input
                                type="text"
                                value={shortcuts.prevFrame}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('prevFrame', e.target.value)}
                            />
                        </label>
                        <label>
                            枝折り登録・解除:
                            <input
                                type="text"
                                value={shortcuts.toggleBookmark}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('toggleBookmark', e.target.value)}
                            />
                        </label>
                        <label>
                            次の枝折りコマ:
                            <input
                                type="text"
                                value={shortcuts.nextBookmark}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('nextBookmark', e.target.value)}
                            />
                        </label>
                        <label>
                            前の枝折りコマ:
                            <input
                                type="text"
                                value={shortcuts.prevBookmark}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('prevBookmark', e.target.value)}
                            />
                        </label>
                        <label>
                            選択を上へ:
                            <input
                                type="text"
                                value={shortcuts.selectUp}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('selectUp', e.target.value)}
                            />
                        </label>
                        <label>
                            選択を下へ:
                            <input
                                type="text"
                                value={shortcuts.selectDown}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('selectDown', e.target.value)}
                            />
                        </label>
                        <label>
                            画層を上へ:
                            <input
                                type="text"
                                value={shortcuts.layerUp}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('layerUp', e.target.value)}
                            />
                        </label>
                        <label>
                            画層を下へ:
                            <input
                                type="text"
                                value={shortcuts.layerDown}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('layerDown', e.target.value)}
                            />
                        </label>
                        <label>
                            現在のコマを保存:
                            <input
                                type="text"
                                value={shortcuts.saveFrame}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('saveFrame', e.target.value)}
                            />
                        </label>
                        <label>
                            諸元を保存:
                            <input
                                type="text"
                                value={shortcuts.saveData}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('saveData', e.target.value)}
                            />
                        </label>
                        <label>
                            半速:
                            <input
                                type="text"
                                value={shortcuts.halfSpeed}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('halfSpeed', e.target.value)}
                            />
                        </label>
                        <label>
                            等速:
                            <input
                                type="text"
                                value={shortcuts.normalSpeed}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('normalSpeed', e.target.value)}
                            />
                        </label>
                        <label>
                            倍速:
                            <input
                                type="text"
                                value={shortcuts.halfSpeed}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('twiceSpeed', e.target.value)}
                            />
                        </label>
                        <label>
                            N秒前へ:
                            <input
                                type="text"
                                value={shortcuts.skipBackward}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('skipBackward', e.target.value)}
                            />
                        </label>
                        <label>
                            N秒先へ:
                            <input
                                type="text"
                                value={shortcuts.skipForward}
                                style={{ width: '4em' }}
                                onChange={(e) => handleShortcutChange('skipForward', e.target.value)}
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
            {videoFile && (
                <div>
                    <button 
                        onClick={saveDataToFile}
                        onMouseEnter={(e) => e.target.setAttribute('title', shortcuts.saveData)}
                    >諸元を保存</button>
                    <label>
                        諸元を読み込む:
                        <input type="file" accept="application/json" onChange={loadDataFromFile} />
                    </label>
                </div>
            )}
            {videoFile && (
                <ul>
                    <li>
                        <a href='https://github.com/GoNishimura/komakai-okuri' target="_blank" rel="noreferrer">codes (GitHub)</a>
                    </li>
                    <li>
                        <a href='https://ko-fi.com/5246ra' target="_blank" rel="noreferrer">おひねりください</a>
                    </li>
                </ul>
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
