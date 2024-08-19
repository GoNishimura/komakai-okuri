import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ videoFile, onTimeUpdate, onLoadedMetadata, videoRef }) => {

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
    }, [onTimeUpdate, onLoadedMetadata, videoRef]);

    return (
        <div className="video-player-container">
            <video ref={videoRef} controls>
                <source src={URL.createObjectURL(videoFile)} type={videoFile.type} />
                Your browser does not support the video tag.
            </video>

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
