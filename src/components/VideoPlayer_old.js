import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ videoFile, onTimeUpdate, onLoadedMetadata }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            const handleTimeUpdate = () => {
                onTimeUpdate(videoRef.current.currentTime);
            };

            const handleLoadedMetadata = () => {
                onLoadedMetadata(videoRef.current.duration);
            };

            videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
            videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

            return () => {
                videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
                videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            };
        }
    }, [onTimeUpdate, onLoadedMetadata]);

    return (
        <div className="video-player-container">
            <video ref={videoRef} controls>
                <source src={URL.createObjectURL(videoFile)} type={videoFile.type} />
                Your browser does not support the video tag.
            </video>

            <style jsx="true">{`
                .video-player-container {
                    max-width: 100%; /* 横幅を100%に制限 */
                    display: flex;
                    justify-content: center;
                }
                video {
                    max-width: 100%;
                    max-height: 80vh; /* 縦幅を画面の80%に制限 */
                    width: auto;
                    height: auto;
                }
            `}</style>
        </div>
    );
};

export default VideoPlayer;
