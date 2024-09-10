import { time2FrameIndex } from '../utils.js';

const Timeline = ({ 
    duration, 
    currentTime, 
    layersData, 
    onFrameOkuri, 
    onFrameRateChange, 
    startOffset, 
    onBookmarkToggle, 
    onBookmarkFrameOkuri,
    onRemoveLayer,
    onMoveLayer
}) => {
    const handleFrameRateChange = (event, index) => {
        const newFrameRates = [...layersData.map(layer => layer.frameRate)];
        newFrameRates[index] = parseFloat(event.target.value);
        onFrameRateChange(newFrameRates);
    };

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
                <div key={index} className="layer">
                    <input 
                        type="number" 
                        value={layer.frameRate} 
                        onChange={(e) => handleFrameRateChange(index, e.target.value)}
                        style={{ width: '4em' }}
                    />コマ/秒（FPS）
                    <span>{showFrameNumber(currentTime, layer.frameRate)} コマ目</span>
                    <button onClick={() => onFrameOkuri(layer.frameRate, 'backward')}>前コマ</button>
                    <button onClick={() => onFrameOkuri(layer.frameRate, 'forward')}>次コマ</button>
                    <button onClick={() => onBookmarkToggle(index)}>
                        {layer.bookmarkedFrames.includes(time2FrameIndex(currentTime, layer.frameRate, startOffset)) ? '栞解除' : '枝折る'}
                    </button>
                    <button onClick={() => onBookmarkFrameOkuri(index, 'backward')}>前栞</button>
                    <button onClick={() => onBookmarkFrameOkuri(index, 'forward')}>次栞</button>
                    <button onClick={() => onMoveLayer(index, 'up')}>上へ</button>
                    <button onClick={() => onMoveLayer(index, 'down')}>下へ</button>
                    <button onClick={() => onRemoveLayer(index)}>画層削除</button>
                    <div className="timeline-bar" onClick={(e) => handleClickOnFrame(e, layer.frameRate)}>
                        {layer.frameTimes.map((time, frameIndex) => (
                            <div
                            key={frameIndex}
                            className={`tick${layer.bookmarkedFrames.includes(frameIndex) ? ' bookmarked' : ''}`}
                            style={{ left: `${(time / duration) * 100}%` }}
                            ></div>
                        ))}
                        <div
                            className="current-time-indicator"
                            style={{ left: `${(currentTime / duration) * 100}%` }}
                        ></div>
                    </div>
                </div>
            ))}
            <style jsx="true">{`
                .layer {
                    margin-bottom: 10px;
                }
                .timeline-bar {
                    position: relative;
                    height: 20px;
                    background-color: #e0e0e0;
                }
                .current-time-indicator {
                    position: absolute;
                    height: 100%;
                    width: 2px;
                    background-color: red;
                    top: 0;
                }
                .tick {
                    position: absolute;
                    height: 100%;
                    width: 1px;
                    background-color: black;
                    top: 0;
                }
                .tick.bookmarked {
                    background-color: green;
                    width: 3px;
                }
            `}</style>
        </div>
    );
};

export default Timeline;
