import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface CameraStreamComponentProps {
    streamUrl: string;
    title?: string;
}

const CameraStreamComponent = ({ streamUrl, title = "Live Camera Feed" }: CameraStreamComponentProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });

            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(err => {
                    console.log('Autoplay prevented:', err);
                });
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('Network error, trying to recover...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Media error, trying to recover...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.log('Fatal error, destroying HLS instance');
                            hls.destroy();
                            break;
                    }
                }
            });

            return () => {
                hls.destroy();
            };
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(err => {
                    console.log('Autoplay prevented:', err);
                });
            });
        }
    }, [streamUrl]);

    return (
        <div className="hidden md:block w-full bg-zinc-900 rounded-md overflow-hidden p-3">
            <span className="flex gap-x-2 bg-zinc-800 text-zinc-500 font-bold p-3 rounded-md h-9 items-center">
                {title}
                <div className="relative">
                    <div className="flex w-2 h-2 bg-rose-500 rounded-full">
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-rose-500 opacity-75 animate-ping"></div>
                    </div>
                </div>
            </span>
            <div className="relative w-full aspect-[5/2] pt-3 rounded-md">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover object-bottom rounded-md"
                    muted
                    playsInline
                />
            </div>
        </div>
    );
};

export default CameraStreamComponent;