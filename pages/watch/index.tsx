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
      console.log('🔧 Setting up PX event listener...');
      setPxStatus("Setting up PX event listener...");

      // Set up the PX async init function
      (window as any).PXjJ0cYtn9_asyncInit = function (px: any) {
        console.log('🎯 PXjJ0cYtn9_asyncInit called with PX object:', px);
        console.log('🔍 PX object type:', typeof px);
        console.log('🔍 PX object keys:', px ? Object.keys(px) : 'null/undefined');

        // Validate that the PX object has Events API
        if (!px || !px.Events || typeof px.Events.on !== 'function') {
          console.error('❌ PX object does not have Events API:', px);
          console.log('❌ px.Events:', px ? px.Events : 'px is null/undefined');
          console.log('❌ px.Events.on type:', px && px.Events ? typeof px.Events.on : 'N/A');
          setPxStatus("PX object missing Events API - score monitoring unavailable");
          return;
        }

        console.log('✅ PX object validation passed, Events API available');
        console.log('🔍 Events object:', px.Events);
        console.log('🔍 Events.on function:', px.Events.on);

        setPxStatus("PX initialized - listening for score events...");

        try {
          console.log('🔌 Setting up score event listener...');
          px.Events.on('score', function (score: any, kind: string) {
            console.log('🚨 PX SCORE EVENT FIRED!');
            console.log('🚨 Score:', score);
            console.log('🚨 Kind:', kind);
            console.log('🚨 Score type:', typeof score);
            console.log('🚨 Kind type:', typeof kind);

            // Only process binary scores since hashed scores are not available
            if (kind === 'binary') {
              console.log('✅ Processing binary score:', score);

              const scoreEvent = {
                timestamp: new Date().toISOString(),
                kind: kind,
                score: score,
                id: Date.now() + Math.random()
              };

              console.log('📦 Created score event object:', scoreEvent);

              console.log('🔄 Updating React state with score event...');
              setPxScoreData(prev => {
                console.log('📊 Previous score data length:', prev.length);
                const newData = [scoreEvent, ...prev.slice(0, 9)];
                console.log('📊 New score data length:', newData.length);
                return newData;
              });

              const statusMessage = `Binary score captured: ${score} - ${new Date().toLocaleTimeString()}`;
              console.log('📱 Setting status:', statusMessage);
              setPxStatus(statusMessage);

              console.log('🍞 Showing toast notification...');
              showToast(`PX Binary Score: ${score}`);

              console.log('✅ Binary score processing complete');
            } else {
              console.log(`⏭️ Ignoring ${kind} score (binary-only mode):`, score);
            }
          });
          console.log('✅ Score event listener setup complete');
        } catch (error) {
          console.error('❌ Error setting up score event listener:', error);
          setPxStatus("Error setting up score event listener");
        }
      };

      // Check if PX is already loaded (try different variations, but only use ones with Events API)
      console.log('🔍 Checking for existing PX objects...');

      const pxCandidates = [
        { name: 'window.px', obj: (window as any).px },
        { name: 'window.PX', obj: (window as any).PX },
        { name: 'window.PXjJ0cYtn9', obj: (window as any).PXjJ0cYtn9 },
        { name: 'window._PXjJ0cYtn9', obj: (window as any)._PXjJ0cYtn9 }
      ];

      console.log('🔍 PX candidates found:');
      pxCandidates.forEach(candidate => {
        console.log(`  ${candidate.name}:`, !!candidate.obj, candidate.obj ? typeof candidate.obj : 'undefined');
        if (candidate.obj) {
          console.log(`    Keys:`, Object.keys(candidate.obj));
          console.log(`    Has Events:`, !!candidate.obj.Events);
          console.log(`    Events.on type:`, candidate.obj.Events ? typeof candidate.obj.Events.on : 'N/A');
        }
      });

      const validCandidates = pxCandidates.filter(c => c.obj).map(c => c.obj);
      const pxObject = validCandidates.find(px => px && px.Events && typeof px.Events.on === 'function');

      if (pxObject) {
        console.log('✅ Found PX object with Events API, calling asyncInit with:', pxObject);
        console.log('🔍 Events methods:', Object.keys(pxObject.Events));
        (window as any).PXjJ0cYtn9_asyncInit(pxObject);
      } else {
        console.log('⏳ No PX object with Events API found yet, waiting for async init callback');
        if (validCandidates.length > 0) {
          console.log('📋 Found PX objects but without Events API:', validCandidates);
        } else {
          console.log('📋 No PX objects found at all');
        }
      }
    };

    console.log('🚀 Starting PX listener setup...');
    setupPxListener();
    console.log('✅ PX listener setup initiated');

    return () => {
      console.log('🧹 Cleaning up PX async init function...');
      // Cleanup - remove the function
      if ((window as any).PXjJ0cYtn9_asyncInit) {
        delete (window as any).PXjJ0cYtn9_asyncInit;
        console.log('✅ PX async init function cleaned up');
      }
    };
  }, []);

  // Debug: Log whenever pxScoreData changes
  useEffect(() => {
    console.log('📊 pxScoreData state changed:', pxScoreData);
    console.log('📊 pxScoreData length:', pxScoreData.length);
    if (pxScoreData.length > 0) {
      console.log('📊 Latest score event:', pxScoreData[0]);
    }
  }, [pxScoreData]);

  // Debug: Log whenever pxStatus changes
  useEffect(() => {
    console.log('📱 pxStatus changed:', pxStatus);
  }, [pxStatus]);

  // Start consistent XHR calls when video starts playing
  useEffect(() => {
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
            {/* Debug info */}
            <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>
              Debug: pxScoreData array length = {pxScoreData.length}
            </div>
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
                      Kind: {event.kind} (Block Decision)
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#d63031",
                        marginBottom: "5px"
                      }}>
                        BINARY SCORE: {typeof event.score === 'object' ? JSON.stringify(event.score) : event.score}
                      </div>
                      <div style={{ fontSize: "18px", color: "#636e72", fontWeight: "bold" }}>
                        🚫 BLOCK DECISION
                      </div>
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
              🔍 <strong>PerimeterX Binary Score Monitoring:</strong>
              <br />
              This panel captures binary score events from PerimeterX (block decisions only).
              <br />
              • <strong>Binary Score:</strong> Block decision values in red
              <br />
              • Hashed scores are not available in this configuration
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
