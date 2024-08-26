function Timeline({ duration, currentTime, tickRowsData, onFrameOkuri, onFrameRateChange, startOffset, bookmarkedFrames, onBookmarkToggle, onBookmarkFrameOkuri }) {

    const handleFrameRateChange = (index, newFrameRate) => {
        const updatedFrameRates = tickRowsData.map(row => row.frameRate);
        updatedFrameRates[index] = parseFloat(newFrameRate);
        onFrameRateChange(updatedFrameRates);
    };

    const calculateFrameNumber = (time, frameRate) => {
        return ((time - startOffset) * frameRate + 1).toFixed(3);
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

    const isFrameBookmarked = (time) => bookmarkedFrames.includes(time);

    return (
        <div className="timeline">
            <div className="timeline-header">
                <button onClick={onBookmarkToggle}>{isFrameBookmarked(currentTime) ? "枝折り解除" : "ここを枝折る"}</button>
                <button onClick={() => onBookmarkFrameOkuri('backward')}>枝折り前コマ送り</button>
                <button onClick={() => onBookmarkFrameOkuri('forward')}>枝折り次コマ送り</button>
            </div>
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
                        <button onClick={() => onFrameOkuri(tickRow.frameRate, 'backward')}>←</button>
                        <button onClick={() => onFrameOkuri(tickRow.frameRate, 'forward')}>→</button>
                        <span>{calculateFrameNumber(currentTime, tickRow.frameRate)} コマ目</span>
                    </div>
                    <div className="timeline-row-body" onClick={(e) => handleClickOnFrame(e, tickRow.frameRate)}>
                        {tickRow.frameTimes.map((time, frameIndex) => (
                            <div
                                key={frameIndex}
                                className="tick"
                                style={{
                                    left: `${(time / duration) * 100}%`,
                                    backgroundColor: isFrameBookmarked(time) ? 'green' : 'black',
                                    width: isFrameBookmarked(time) ? '2px' : '1px'
                                }}
                            >
                            </div>
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
                .tick {
                    position: absolute;
                    top: 0;
                    bottom: 0;
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
