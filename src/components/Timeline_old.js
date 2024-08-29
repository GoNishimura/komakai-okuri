import { time2FrameIndex } from '../utils.js';

function Timeline({ duration, currentTime, tickRowsData, onFrameOkuri, onFrameRateChange, startOffset, onBookmarkToggle, onBookmarkFrameOkuri }) {

    const handleFrameRateChange = (index, newFrameRate) => {
        const updatedFrameRates = tickRowsData.map(row => row.frameRate);
        updatedFrameRates[index] = parseFloat(newFrameRate);
        onFrameRateChange(updatedFrameRates);
    };

    const handleClickOnFrame = (e, frameRate) => {
        const timelineRowBody = e.currentTarget;
        const clickPosition = e.clientX - timelineRowBody.getBoundingClientRect().left;
        const clickTime = (clickPosition / timelineRowBody.offsetWidth) * duration;
        const tickRow = tickRowsData.find(tickRow => tickRow.frameRate === frameRate);
        const nearestPreviousTime = [...tickRow.frameTimes].reverse().find(time => time <= clickTime);
        const video = document.querySelector('video');
        if (video) {
            video.currentTime = nearestPreviousTime !== undefined ? nearestPreviousTime : clickTime;
        }
    };

    return (
        <div className="timeline">
            {tickRowsData.map((tickRow, index) => (
                <div key={index} className="timeline-row">
                    <div className="timeline-row-header">
                        <input
                            type="number"
                            value={tickRow.frameRate}
                            onChange={(e) => handleFrameRateChange(index, e.target.value)}
                            style={{ width: '4em' }}
                        />
                        <span>コマ/秒（FPS）</span>
                        <span>{((currentTime - startOffset) * tickRow.frameRate + 1).toFixed(3)} コマ目</span>
                        <button onClick={() => onFrameOkuri(tickRow.frameRate, 'backward')}>←</button>
                        <button onClick={() => onFrameOkuri(tickRow.frameRate, 'forward')}>→</button>
                        <button onClick={() => onBookmarkToggle(index)}>
                            {tickRow.bookmarkedFrames.includes(time2FrameIndex(currentTime, tickRow.frameRate, startOffset)) ? '枝折り解除' : '枝折る'}
                        </button>
                        <button onClick={() => onBookmarkFrameOkuri(index, 'backward')}>枝折り←</button>
                        <button onClick={() => onBookmarkFrameOkuri(index, 'forward')}>枝折り→</button>
                    </div>
                    <div className="timeline-row-body" onClick={(e) => handleClickOnFrame(e, tickRow.frameRate)}>
                        {tickRow.frameTimes.map((time, i) => (
                            <div
                                key={i}
                                className={`tick-mark ${tickRow.bookmarkedFrames.includes(i) ? 'bookmarked' : ''}`}
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
                .timeline {
                    position: relative;
                    height: 100px;
                    border: 1px solid #ccc;
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
                    flex-grow: 1;
                    height: 20px;
                    background: #eee;
                }
                .tick-mark {
                    position: absolute;
                    width: 1px;
                    height: 100%;
                    background: #666;
                }
                .tick-mark.bookmarked {
                    background: green;
                    width: 4px;
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
