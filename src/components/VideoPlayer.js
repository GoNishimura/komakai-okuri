import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({ videoFile, videoRef, isCrosshairVisible, isLoopEnabled, colorPalette, onTimeUpdate, onLoadedMetadata }) => {
    const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);

    useEffect(() => {
        const videoElement = videoRef.current;

        const updateVideoSize = () => {
            if (videoElement) {
                const rect = videoElement.getBoundingClientRect();
                setVideoSize({ width: rect.width, height: rect.height });
            }
        };

        updateVideoSize();
        window.addEventListener('resize', updateVideoSize);

        return () => {
            window.removeEventListener('resize', updateVideoSize);
        };
    }, [onLoadedMetadata, videoRef, isCrosshairVisible, colorPalette]);

    useEffect(() => {
        const videoElement = videoRef.current;

        if (videoElement) {
            // videoElement.muted = true;
            videoElement.loop = isLoopEnabled;

            const handleTimeUpdate = () => {
                onTimeUpdate(videoElement.currentTime);
            };

            const handleLoadedMetadata = () => {
                onLoadedMetadata(videoElement.duration);
            };

            videoElement.addEventListener('timeupdate', handleTimeUpdate);
            videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

            return () => {
                videoElement.removeEventListener('timeupdate', handleTimeUpdate);
                videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
            };
        }
    }, [videoFile, onTimeUpdate, onLoadedMetadata, videoRef, isLoopEnabled]);

    return (
        <div className="video-player-container" ref={containerRef}>
            <video ref={videoRef} controls>
                <source src={URL.createObjectURL(videoFile)} type={videoFile.type} />
                Your browser does not support the video tag.
            </video>

            {/* 十字線の描画 */}
            {isCrosshairVisible && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${videoSize.width - 2}px`,
                    height: `${videoSize.height - 2}px`,
                    pointerEvents: 'none',
                    justifyContent: 'center',
                    border: `solid 2px ${colorPalette.crosshair}`
                }}>
                    {/* 縦線 */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        width: '2px',
                        height: '100%',
                        backgroundColor: colorPalette.crosshair,
                    }} />
                    {/* 横線 */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        width: '100%',
                        height: '2px',
                        backgroundColor: colorPalette.crosshair,
                    }} />
                </div>
            )}

            <style jsx="true">{`
                .video-player-container {
                    max-width: 100%;
                    display: flex;
                    position: relative; /* 十字線用に relative を設定 */
                }
                video {
                    max-width: 100%;
                    max-height: 80vh;
                    width: auto;
                    height: auto;
                }
            `}</style>
        </div>
    );
};

export default VideoPlayer;
