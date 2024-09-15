import { time2FrameIndex } from '../utils.js';

const Timeline = ({ 
    duration, 
    currentTime, 
    layersData, 
    startOffset, 
    colorPalette,
    selectedLayerIndex,
    onFrameOkuri, 
    onFrameRateChange, 
    onBookmarkToggle, 
    onBookmarkFrameOkuri,
    onRemoveLayer,
    onMoveLayer,
    onSelectedLayerChange,
}) => {

    const handleClickOnFrame = (e, frameRate) => {
        const timelineRowBody = e.currentTarget;
        const clickPosition = e.clientX - timelineRowBody.getBoundingClientRect().left;
        const clickTime = (clickPosition / timelineRowBody.offsetWidth) * duration;
        const layer = layersData.find(layer => layer.frameRate === frameRate);
        const nearestPreviousTime = [...layer.frameTimes].reverse().find(time => time <= clickTime);
        const video = document.querySelector('video');
        if (video) {
            video.currentTime = nearestPreviousTime !== undefined ? nearestPreviousTime : clickTime;
        }
    };

    const showFrameNumber = (time, frameRate) => {
        const fullFrameNumber = ((duration - startOffset) * frameRate + 1).toFixed(3).toString();
        const frameNumberNow = ((time - startOffset) * frameRate + 1).toFixed(3).toString();
        return frameNumberNow.padStart(fullFrameNumber.length, '0')
    };

    return (
        <div>
            {layersData.map((layer, index) => (
                <div 
                    key={index} 
                    className="layer"
                    style={{
                        border: selectedLayerIndex === index ? `2px solid ${colorPalette.selectedLayer}` : '2px solid transparent',
                        cursor: 'pointer',
                    }}
                    onClick={() => onSelectedLayerChange(index)}
                >
                    <input 
                        type="number" 
                        value={layer.frameRate} 
                        onChange={(e) => onFrameRateChange(index, e.target.value)}
                        style={{ width: '4em' }}
                    />コマ/秒（FPS）
                    <span>{showFrameNumber(currentTime, layer.frameRate)} コマ目</span>
                    <button onClick={() => onFrameOkuri(index, 'backward')}>前コマ</button>
                    <button onClick={() => onFrameOkuri(index, 'forward')}>次コマ</button>
                    <button onClick={() => onBookmarkToggle(index)}>
                        {layer.bookmarkedFrames.includes(time2FrameIndex(currentTime, layer.frameRate, startOffset)) ? '栞解除' : '枝折る'}
                    </button>
                    <button onClick={() => onBookmarkFrameOkuri(index, 'backward')}>前栞</button>
                    <button onClick={() => onBookmarkFrameOkuri(index, 'forward')}>次栞</button>
                    <button onClick={() => onMoveLayer(index, 'up')}>上へ</button>
                    <button onClick={() => onMoveLayer(index, 'down')}>下へ</button>
                    <button onClick={() => onRemoveLayer(index)}>画層削除</button>
                    <div
                        className="timeline-row-body"
                        onClick={(e) => handleClickOnFrame(e, layer.frameRate, index)}
                    >
                        {layer.frameTimes.map((time, idx) => {
                            const position = (time / duration) * 100;
                            const isBookmarked = layer.bookmarkedFrames.includes(idx)
                            return (
                                <div
                                    key={idx}
                                    className={`tick${isBookmarked ? ' bookmarked' : ''}`}
                                    style={{
                                        left: `${position}%`,
                                        backgroundColor: isBookmarked ? colorPalette.bookmark : 'black',
                                        width: isBookmarked ? '3px' : '1px',
                                    }}
                                />
                            );
                        })}
                        <div
                            className="current-time-indicator"
                            style={{ 
                                left: `${(currentTime / duration) * 100}%`, 
                                backgroundColor: colorPalette.currentTimeIndicator
                            }}
                        ></div>
                    </div>
                </div>
            ))}
            <style jsx="true">{`
                .layer {
                    margin-bottom: 20px;
                }
                .timeline-row-body {
                    position: relative;
                    height: 20px;
                    background-color: #e0e0e0;
                    margin: 10px 0;
                }
                .current-time-indicator {
                    position: absolute;
                    height: 100%;
                    width: 2px;
                    top: 0;
                }
                .tick {
                    position: absolute;
                    height: 20px;
                }
            `}</style>
        </div>
    );
};

export default Timeline;

