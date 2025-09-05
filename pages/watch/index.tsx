// pages/watch/index.tsx
import { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import Head from "next/head";

interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  author: {
    name: string;
    subscribers: number;
  };
}

interface AdBreak {
  adId: string;
  duration: number;
  type: string;
}

const WatchPage: NextPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoData, setVideoData] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [currentAd, setCurrentAd] = useState<AdBreak | null>(null);
  const [adTimeLeft, setAdTimeLeft] = useState(0);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [lastEventLog, setLastEventLog] = useState<string>("");
  const [pxScoreData, setPxScoreData] = useState<any[]>([]);
  const [pxStatus, setPxStatus] = useState<string>("Waiting for PX events...");

  // Snackbar state for UX feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  const showToast = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarOpen(true);
  };

  // XHR call intervals
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const adTrackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);

  // Fetch video metadata on component mount
  useEffect(() => {
    console.log("are you being called");
    const fetchVideoData = async () => {
      try {
        const response = await fetch("/api/player-metadata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ videoId: "sample_video_001" }),
        });
        const result = await response.json();
        if (result.success) {
          setVideoData(result.data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch video metadata:", error);
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, []);

  // PX Risk Event Listener Setup
  useEffect(() => {
    const setupPxListener = () => {
      setPxStatus("Setting up PX event listener...");

      // Set up the PX async init function
      (window as any).PXjJ0cYtn9_asyncInit = function (px: any) {
        setPxStatus("PX initialized - listening for score events...");

        px.Events.on('score', function (score: any, kind: string) {
          console.log('PX SCORE DATA:', score, kind);

          const scoreEvent = {
            timestamp: new Date().toISOString(),
            kind: kind,
            score: score,
            id: Date.now() + Math.random()
          };

          setPxScoreData(prev => [scoreEvent, ...prev.slice(0, 9)]); // Keep last 10 events
          setPxStatus(`Score event captured: ${kind} - ${new Date().toLocaleTimeString()}`);
          showToast(`PX Score Event: ${kind}`);
        });
      };

      // Check if PX is already loaded (try different variations)
      const pxObject = (window as any).px || (window as any).PX || (window as any).PXjJ0cYtn9 || (window as any)._PXjJ0cYtn9;
      if (pxObject) {
        console.log('Found PX object, calling asyncInit with:', pxObject);
        (window as any).PXjJ0cYtn9_asyncInit(pxObject);
      } else {
        console.log('No PX object found yet, waiting for async init callback');
      }
    };

    setupPxListener();

    return () => {
      // Cleanup - remove the function
      if ((window as any).PXjJ0cYtn9_asyncInit) {
        delete (window as any).PXjJ0cYtn9_asyncInit;
      }
    };
  }, []);

  // Start consistent XHR calls when video starts playing
  useEffect(() => {
    console.log("isPlaying is tested");
    if (!isPlaying) {
      // Clear all intervals when paused
      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current);
      if (analyticsIntervalRef.current)
        clearInterval(analyticsIntervalRef.current);
      if (adTrackingIntervalRef.current)
        clearInterval(adTrackingIntervalRef.current);
      return;
    }

    // Video heartbeat every 10 seconds
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch("/api/player-heartbeat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            videoId: videoData?.videoId,
            position: currentTimeRef.current,
            duration: durationRef.current,
            quality: "1080p",
          }),
        });
        const result = await response.json();
        setApiCallCount((prev) => prev + 1);
        setLastEventLog(`Heartbeat: ${result.success ? "Success" : "Failed"}`);

        // Handle ad break from heartbeat response
        if (result.adBreak && !showAd) {
          setCurrentAd(result.adBreak);
          setAdTimeLeft(result.adBreak.duration);
          setShowAd(true);
        }
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    }, 10000);

    // Analytics tracking every 15 seconds
    analyticsIntervalRef.current = setInterval(async () => {
      const events = ["play", "progress", "engagement", "quality_change"];
      const randomEvent = events[Math.floor(Math.random() * events.length)];

      try {
        const response = await fetch("/api/player-analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            event: randomEvent,
            videoId: videoData?.videoId,
            timestamp: Date.now(),
            position: currentTimeRef.current,
            duration: durationRef.current,
          }),
        });
        const result = await response.json();
        setApiCallCount((prev) => prev + 1);
        setLastEventLog(`Analytics: ${randomEvent} tracked`);
      } catch (error) {
        console.error("Analytics failed:", error);
      }
    }, 15000);

    // Ad tracking every 20 seconds
    adTrackingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch("/api/player-ads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            videoId: videoData?.videoId,
            adPosition: "midroll",
          }),
        });
        const result = await response.json();
        setApiCallCount((prev) => prev + 1);
        setLastEventLog(`Ad Tracking: ${result.data?.event || "tracked"}`);
      } catch (error) {
        console.error("Ad tracking failed:", error);
      }
    }, 20000);

    return () => {
      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current);
      if (analyticsIntervalRef.current)
        clearInterval(analyticsIntervalRef.current);
      if (adTrackingIntervalRef.current)
        clearInterval(adTrackingIntervalRef.current);
    };
  }, [isPlaying, videoData?.videoId, showAd]);

  // Handle ad countdown
  useEffect(() => {
    let adInterval: NodeJS.Timeout;
    if (showAd && adTimeLeft > 0) {
      adInterval = setInterval(() => {
        setAdTimeLeft((prev) => {
          if (prev <= 1) {
            setShowAd(false);
            setCurrentAd(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (adInterval) clearInterval(adInterval);
    };
  }, [showAd, adTimeLeft]);

  // Video event handlers
  const handlePlay = () => {
    setIsPlaying(true);
    try {
      videoRef.current?.play()?.catch(() => {
        // Ignore play() promise rejection (autoplay/gesture policies)
      });
    } catch {
      // No-op: best effort
    }
    showToast("Playing");
  };

  const handlePause = () => {
    setIsPlaying(false);
    try {
      videoRef.current?.pause();
    } catch {
      // No-op
    }
    showToast("Paused");
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const t = videoRef.current.currentTime;
      setCurrentTime(t);
      currentTimeRef.current = t;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      setDuration(d);
      durationRef.current = d;
    }
  };

  // Sync the video element's muted property
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      showToast(next ? "Muted" : "Unmuted");
      return next;
    });
  };

  // Keyboard shortcut: 'm' toggles mute
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsMuted((prev) => {
          const next = !prev;
          showToast(next ? "Muted" : "Unmuted");
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const skipAd = () => {
    if (adTimeLeft <= 5) {
      setShowAd(false);
      setCurrentAd(null);
      setAdTimeLeft(0);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div>Loading video player...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{videoData?.title || "Video Player"} - Watch</title>
        <meta
          name="description"
          content={videoData?.description || "Video streaming platform"}
        />
      </Head>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Video Player Container */}
        <div
          style={{
            position: "relative",
            backgroundColor: "#000",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            width="100%"
            height="auto"
            style={{ display: showAd ? "none" : "block", maxHeight: "600px" }}
            onClick={isPlaying ? handlePause : handlePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            muted={isMuted}
            poster={videoData?.thumbnailUrl}
          >
            <source src={videoData?.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Ad Overlay */}
          {showAd && currentAd && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "#1a1a1a",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "20px" }}>
                Advertisement
              </div>
              <div
                style={{
                  width: "300px",
                  height: "200px",
                  backgroundColor: "#333",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                [Ad Content - {currentAd.type}]
              </div>
              <div style={{ fontSize: "16px", marginBottom: "10px" }}>
                Ad ends in {adTimeLeft}s
              </div>
              {adTimeLeft <= 5 && (
                <button
                  onClick={skipAd}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Skip Ad
                </button>
              )}
            </div>
          )}

          {/* Video Controls */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              padding: "20px",
              color: "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "24px",
                }}
              >
                {isPlaying ? "⏸️" : "▶️"}
              </button>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: "4px",
                    backgroundColor: "rgba(255,255,255,0.3)",
                    borderRadius: "2px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      backgroundColor: "#ff0000",
                      borderRadius: "2px",
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <span style={{ fontSize: "14px" }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <button
                onClick={handleToggleMute}
                aria-pressed={isMuted}
                aria-label={isMuted ? "Unmute" : "Mute"}
                title={isMuted ? "Unmute" : "Mute"}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "22px",
                  marginLeft: "8px",
                }}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div style={{ marginTop: "20px" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "10px" }}>
            {videoData?.title}
          </h1>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "15px",
              color: "#666",
            }}
          >
            <span>{videoData?.views?.toLocaleString()} views</span>
            <span>by {videoData?.author.name}</span>
          </div>

          <p style={{ lineHeight: "1.6", color: "#333" }}>
            {videoData?.description}
          </p>
        </div>

        {/* API Call Monitoring Panel */}
        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
            API Monitoring Dashboard
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
            }}
          >
            <div>
              <strong>Total API Calls:</strong> {apiCallCount}
            </div>
            <div>
              <strong>Last Event:</strong> {lastEventLog || "None"}
            </div>
            <div>
              <strong>Player Status:</strong> {isPlaying ? "Playing" : "Paused"}
            </div>
            <div>
              <strong>Current Time:</strong> {formatTime(currentTime)}
            </div>
          </div>

          <div style={{ marginTop: "15px", fontSize: "14px", color: "#666" }}>
            <p>
              🔄 <strong>Active XHR Calls:</strong>
              <br />
              • Heartbeat every 10s (video progress & ad decisions)
              <br />
              • Analytics every 15s (engagement tracking)
              <br />• Ad tracking every 20s (ad performance metrics)
            </p>
          </div>
        </div>

        {/* PX Risk Monitoring Panel */}
        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            backgroundColor: "#fff3cd",
            borderRadius: "8px",
            border: "1px solid #ffeaa7",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
            PX Binary Score Monitor
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <strong>Status:</strong> <span style={{ color: "#2d3436" }}>{pxStatus}</span>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <strong>Total Score Events Captured:</strong> {pxScoreData.length}
          </div>

          {pxScoreData.length > 0 && (
            <div>
              <h4 style={{ margin: "15px 0 10px 0", fontSize: "16px" }}>
                Recent Score Events:
              </h4>
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "10px",
                  backgroundColor: "#fff",
                }}
              >
                {pxScoreData.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      marginBottom: "10px",
                      padding: "10px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "4px",
                      borderLeft: "4px solid #ff6b6b",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                      {event.timestamp}
                    </div>
                    <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                      Kind: {event.kind} {event.kind === "binary" ? "(Block Decision)" : event.kind === "hashed" ? "(Hashed Score)" : ""}
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{
                        fontSize: "28px",
                        fontWeight: "bold",
                        color: event.kind === "binary" ? "#d63031" : "#0984e3",
                        marginBottom: "5px"
                      }}>
                        SCORE: {typeof event.score === 'object' ? JSON.stringify(event.score) : event.score}
                      </div>
                      {event.kind === "binary" && (
                        <div style={{ fontSize: "16px", color: "#636e72", fontWeight: "bold" }}>
                          🚫 BLOCK DECISION
                        </div>
                      )}
                      {event.kind === "hashed" && (
                        <div style={{ fontSize: "16px", color: "#636e72", fontWeight: "bold" }}>
                          🔢 HASHED SCORE
                        </div>
                      )}
                    </div>
                    <div>
                      <strong>Full Score Data:</strong>
                      <pre
                        style={{
                          backgroundColor: "#2d3436",
                          color: "#ddd",
                          padding: "8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          marginTop: "5px",
                          overflow: "auto",
                          maxHeight: "100px",
                        }}
                      >
                        {JSON.stringify(event.score, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "15px", fontSize: "14px", color: "#666" }}>
            <p>
              🔍 <strong>PerimeterX Score Monitoring:</strong>
              <br />
              This panel captures binary score and hashed score events from PerimeterX.
              <br />
              • <strong>Binary:</strong> Block decision (red)
              <br />
              • <strong>Hashed:</strong> Risk assessment score (blue)
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#e8f4fd",
            borderRadius: "8px",
            border: "1px solid #b3d9ff",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0" }}>Video Player Prototype</h4>
          <p style={{ margin: "0", fontSize: "14px" }}>
            This prototype demonstrates continuous XHR calls similar to video
            streaming platforms. Press play to start the video and observe the
            API call counter increasing. The player makes heartbeat, analytics,
            and ad tracking calls at different intervals.
          </p>
        </div>
      </div>

      {/* Snackbar notifications for play/mute status */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setSnackbarOpen(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="info"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default WatchPage;
