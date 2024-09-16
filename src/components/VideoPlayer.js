import React, { useEffect } from 'react';

const VideoPlayer = ({ videoFile, videoRef, isCrosshairVisible, colorPalette, onTimeUpdate, onLoadedMetadata }) => {

    useEffect(() => {
        const videoElement = videoRef.current;

        if (videoElement) {
            videoElement.muted = true;

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
    }, [videoFile, onTimeUpdate, onLoadedMetadata, videoRef]);

    return (
        <div className="video-player-container">
            <video ref={videoRef} controls>
                <source src={URL.createObjectURL(videoFile)} type={videoFile.type} />
                Your browser does not support the video tag.
            </video>
            {isCrosshairVisible && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '80vh',
                    pointerEvents: 'none',
                }}>
                {/* 縦線 */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    width: '2px',
                    height: '100%',
                    backgroundColor: colorPalette.crosshair || 'red',
                    transform: 'translateX(-50%)',
                }} />
                {/* 横線 */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    width: '100%',
                    height: '2px',
                    backgroundColor: colorPalette.crosshair || 'red',
                    transform: 'translateY(-50%)',
                }} />
                </div>
            )}

            <style jsx="true">{`
                .video-player-container {
                    max-width: 100%;
                    display: flex;
                    justify-content: center;
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
