import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ videoFile, onTimeUpdate, onLoadedMetadata }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const videoElement = videoRef.current;

        if (videoElement) {
            // 動画プレイヤーを初期値でミュートに設定
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
