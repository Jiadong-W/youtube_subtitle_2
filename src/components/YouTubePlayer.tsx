"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface YouTubePlayerHandle {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setPlaybackRate: (rate: number) => void;
}

interface YouTubePlayerProps {
  videoId: string;
  aspectRatio: number; // 原视频长宽比，例如 4/3 或 16/9
  initialTime?: number;
  onTimeUpdate: (currentTime: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: {
              data: number;
              target: YTPlayerInstance;
            }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  setPlaybackRate: (suggestedRate: number) => void;
  destroy: () => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  (
    { videoId, aspectRatio, initialTime = 0, onTimeUpdate, onPlayStateChange },
    ref
  ) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<YTPlayerInstance | null>(null);
    const isReadyRef = useRef(false);
    const [isReady, setIsReady] = useState(false);

    const onTimeUpdateRef = useRef(onTimeUpdate);
    const onPlayStateChangeRef = useRef(onPlayStateChange);

    useEffect(() => {
      onTimeUpdateRef.current = onTimeUpdate;
      onPlayStateChangeRef.current = onPlayStateChange;
    }, [onTimeUpdate, onPlayStateChange]);

    useImperativeHandle(ref, () => ({
      seekTo(seconds: number) {
        if (playerRef.current && isReadyRef.current) {
          playerRef.current.seekTo(seconds, true);
          playerRef.current.playVideo();
        }
      },
      play() {
        if (playerRef.current && isReadyRef.current) {
          playerRef.current.playVideo();
        }
      },
      pause() {
        if (playerRef.current && isReadyRef.current) {
          playerRef.current.pauseVideo();
        }
      },
      togglePlay() {
        if (!playerRef.current || !isReadyRef.current) return;
        const state = playerRef.current.getPlayerState();
        if (state === 1) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      },
      setPlaybackRate(rate: number) {
        if (playerRef.current && isReadyRef.current) {
          playerRef.current.setPlaybackRate(rate);
        }
      },
    }));

    useEffect(() => {
      let intervalId: ReturnType<typeof setInterval> | null = null;
      let isUnmounted = false;

      const initPlayer = () => {
        if (isUnmounted || !mountRef.current || !window.YT?.Player) return;

        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {
            // ignore
          }
        }

        playerRef.current = new window.YT.Player(mountRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            cc_load_policy: 0, // 关闭 YouTube 自带烧录字幕遮挡，使用右侧+左下角双语区域
            playsinline: 1,
            ...(initialTime > 0 ? { start: Math.floor(initialTime) } : {}),
          },
          events: {
            onReady: () => {
              if (isUnmounted) return;
              isReadyRef.current = true;
              setIsReady(true);
            },
            onStateChange: (event) => {
              if (isUnmounted) return;
              const playing = event.data === 1;
              onPlayStateChangeRef.current(playing);
              if (playerRef.current) {
                const t = playerRef.current.getCurrentTime();
                if (typeof t === "number") {
                  onTimeUpdateRef.current(t);
                }
              }
            },
          },
        });
      };

      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        const existingScript = document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]'
        );
        if (!existingScript) {
          const tag = document.createElement("script");
          tag.src = "https://www.youtube.com/iframe_api";
          document.head.appendChild(tag);
        }
        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevCallback) prevCallback();
          initPlayer();
        };
      }

      intervalId = setInterval(() => {
        if (playerRef.current && isReadyRef.current) {
          try {
            const state = playerRef.current.getPlayerState();
            if (state === 1) {
              const currentTime = playerRef.current.getCurrentTime();
              if (typeof currentTime === "number") {
                onTimeUpdateRef.current(currentTime);
              }
            }
          } catch {
            // ignore
          }
        }
      }, 100);

      return () => {
        isUnmounted = true;
        isReadyRef.current = false;
        if (intervalId) clearInterval(intervalId);
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {
            // ignore
          }
        }
      };
    }, [videoId, initialTime]);

    // 保持原视频长宽比不变：添加 shrink-0 防止移动端纵向 Flex 挤压视频高度
    const safeRatio =
      aspectRatio && Number.isFinite(aspectRatio) && aspectRatio > 0
        ? aspectRatio
        : 16 / 9;

    return (
      <div className="w-full shrink-0 bg-black rounded-lg overflow-hidden flex items-center justify-center relative shadow-sm">
        <div
          className="w-full max-h-[58vh] flex items-center justify-center mx-auto relative"
          style={{ aspectRatio: "16 / 9" }}
        >
          <div
            className="h-full max-w-full relative"
            style={{ aspectRatio: `${safeRatio}` }}
          >
            <div ref={mountRef} className="w-full h-full" />
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white/80 text-sm">
                正在加载 YouTube 播放器...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

YouTubePlayer.displayName = "YouTubePlayer";

export default YouTubePlayer;
