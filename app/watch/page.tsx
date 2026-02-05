"use client";

// pages/watch/index.tsx
import { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

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
  console.log("🎬 WatchPage component is mounting/rendering...");

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
  const [riskScoreData, setRiskScoreData] = useState<any[]>([]);
  const [riskStatus, setRiskStatus] = useState<string>("Waiting for security events...");
  const [videoDisabled, setVideoDisabled] = useState<boolean>(false);

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
  // Security detection retry control
  const securityRetryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const securityRetryAttemptsRef = useRef(0);
  const securityErrorHandlerRef = useRef<((ev: ErrorEvent) => void) | null>(null);

  // Prevent multiple security setups due to React strict mode
  const securitySetupRef = useRef(false);

  // Fetch video metadata on component mount
  useEffect(() => {
    console.log("🎬 First useEffect (fetchVideoData) is running...");
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

  // Risk Event Listener Setup
  useEffect(() => {
    // Prevent multiple setups due to React strict mode/HMR
    if (securitySetupRef.current) {
      console.log("Security setup already done, skipping to prevent duplication");
      return;
    }
    securitySetupRef.current = true;

    const setupSecurityListener = () => {
      console.log("Setting up binary score listener...");
      setRiskStatus("Setting up binary score listener...");

      // Check for security script
      const secScript = document.getElementById(
        "px-script",
      ) as HTMLScriptElement | null;
      if (secScript) {
        secScript.addEventListener("error", (e) => {
          console.error("Security script failed to load", e);
          setRiskStatus("Security script failed to load");
        });
      }

      // Global resource error handler for security
      const onResError = (ev: ErrorEvent) => {
        const tgt = ev.target as any;
        if (tgt?.tagName === "SCRIPT" && tgt.src?.includes("px-cloud")) {
          console.error("Security script error:", tgt.src);
          setRiskStatus("Security network/script error");
        }
      };
      window.addEventListener("error", onResError, true);
      securityErrorHandlerRef.current = onResError;

      // Set up the security async init function
      (window as any).PXjJ0cYtn9_asyncInit = function (sec: any) {
        console.log("Security initialized for binary score monitoring");

        // Validate that the security object has Events API
        if (!sec || !sec.Events || typeof sec.Events.on !== "function") {
          console.error("Security Events API not available");
          setRiskStatus("Security Events API not available");
          return;
        }

        console.log("Security Events API available");

        setRiskStatus("Initialized - monitoring binary score events...");

        console.log("Setting up binary score listener...");

        // Binary score event handler
        const scoreHandler = function (score, kind) {
          console.log(`Score Event - Score: ${score}, Kind: ${kind}`);

          if (kind === "binary") {
            console.log("Binary block decision:", score);

            // Check if score is 1 (handle both string and number)
            if (score == 1) {
              console.log("Disabling video due to binary score of 1");
              setVideoDisabled(true);
              setIsPlaying(false);

              // Also pause the video element directly to be sure
              if (videoRef.current) {
                videoRef.current.pause();
              }
            }

            const scoreEvent = {
              timestamp: new Date().toISOString(),
              kind: kind,
              score: score,
              id: Date.now() + Math.random(),
            };

            setRiskScoreData((prev) => {
              const newData = [scoreEvent, ...prev.slice(0, 9)];
              return newData;
            });

            const statusMessage = `BINARY BLOCK DECISION: ${score} - ${new Date().toLocaleTimeString()}`;
            setRiskStatus(statusMessage);
            showToast(`Block Decision: ${score}`);
          }
        };

        sec.Events.on("score", scoreHandler);

        console.log("Binary score monitoring setup complete");
      };

      // Check if security module is already loaded
      const candidates = [
        (window as any).px,
        (window as any).PX,
        (window as any).PXjJ0cYtn9,
        (window as any)._PXjJ0cYtn9,
      ];

      const validCandidates = candidates.filter((c) => c);
      const secObject = validCandidates.find(
        (s) => s && s.Events && typeof s.Events.on === "function",
      );

      if (secObject) {
        console.log("Found security object with Events API");
        (window as any).PXjJ0cYtn9_asyncInit(secObject);
      } else {
        console.log("Waiting for security module to load...");

        // Retry detection after script loads
        const maxAttempts = 120;
        if (!securityRetryIntervalRef.current) {
          securityRetryAttemptsRef.current = 0;
          securityRetryIntervalRef.current = setInterval(() => {
            securityRetryAttemptsRef.current += 1;
            const found = candidates.find(
              (p) => p && p.Events && typeof p.Events.on === "function",
            );
            if (found) {
              console.log("Security module detected, initializing...");
              (window as any).PXjJ0cYtn9_asyncInit(found);
              if (securityRetryIntervalRef.current) {
                clearInterval(securityRetryIntervalRef.current);
                securityRetryIntervalRef.current = null;
              }
            } else if (securityRetryAttemptsRef.current >= maxAttempts) {
              if (securityRetryIntervalRef.current) {
                clearInterval(securityRetryIntervalRef.current);
                securityRetryIntervalRef.current = null;
              }
              console.warn("Security module not detected after waiting");
              setRiskStatus("Security module not detected");
            }
          }, 500);
        }
      }
    };

    console.log("Starting binary score monitoring...");
    setupSecurityListener();

    return () => {
      console.log("Cleaning up security async init function...");
      // Cleanup - remove the function
      if ((window as any).PXjJ0cYtn9_asyncInit) {
        delete (window as any).PXjJ0cYtn9_asyncInit;
        console.log("Security async init function cleaned up");
      }
      // Clear security detection retries
      if (securityRetryIntervalRef.current) {
        clearInterval(securityRetryIntervalRef.current);
        securityRetryIntervalRef.current = null;
      }
      // Remove global resource error trap
      if (securityErrorHandlerRef.current) {
        window.removeEventListener(
          "error",
          securityErrorHandlerRef.current as any,
          true,
        );
        securityErrorHandlerRef.current = null;
      }
      // Reset setup ref for re-initialization
      securitySetupRef.current = false;
    };
  }, []);

  // Debug: Log whenever riskScoreData changes
  useEffect(() => {
    console.log("riskScoreData state changed:", riskScoreData);
    if (riskScoreData.length > 0) {
      console.log("Latest score event:", riskScoreData[0]);
    }
  }, [riskScoreData]);

  // Debug: Log whenever riskStatus changes
  useEffect(() => {
    console.log("riskStatus changed:", riskStatus);
  }, [riskStatus]);

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
            minHeight: videoDisabled ? "400px" : "auto",
            height: videoDisabled ? "400px" : "auto",
          }}
        >
          <video
            ref={videoRef}
            width="100%"
            height="auto"
            style={{
              display: showAd || videoDisabled ? "none" : "block",
              maxHeight: "600px",
            }}
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

          {/* Technical Issue Overlay */}
          {videoDisabled && (
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
                minHeight: "400px",
                zIndex: 1000,
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "30px" }}>⚠️</div>
              <div
                style={{
                  fontSize: "24px",
                  marginBottom: "20px",
                  fontWeight: "bold",
                }}
              >
                Technical Issue Detected
              </div>
              <div
                style={{
                  fontSize: "16px",
                  textAlign: "center",
                  maxWidth: "400px",
                  lineHeight: "1.5",
                }}
              >
                We're experiencing technical difficulties with video playback.
                Our team has been notified and is working to resolve this issue.
              </div>
              <div
                style={{ fontSize: "14px", marginTop: "20px", color: "#999" }}
              >
                Please try refreshing the page or check back later.
              </div>
              <div
                style={{ fontSize: "12px", marginTop: "10px", color: "#666" }}
              >
                [DEBUG: Video disabled due to security risk score]
              </div>
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
                onClick={
                  videoDisabled
                    ? undefined
                    : isPlaying
                      ? handlePause
                      : handlePlay
                }
                disabled={videoDisabled}
                style={{
                  background: "none",
                  border: "none",
                  color: videoDisabled ? "#666" : "white",
                  cursor: videoDisabled ? "not-allowed" : "pointer",
                  fontSize: "24px",
                  opacity: videoDisabled ? 0.5 : 1,
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
                onClick={videoDisabled ? undefined : handleToggleMute}
                disabled={videoDisabled}
                aria-pressed={isMuted}
                aria-label={isMuted ? "Unmute" : "Mute"}
                title={isMuted ? "Unmute" : "Mute"}
                style={{
                  background: "none",
                  border: "none",
                  color: videoDisabled ? "#666" : "white",
                  cursor: videoDisabled ? "not-allowed" : "pointer",
                  fontSize: "22px",
                  marginLeft: "8px",
                  opacity: videoDisabled ? 0.5 : 1,
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

        {/* Security Testing Panel */}
        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            backgroundColor: "#f8d7da",
            borderRadius: "8px",
            border: "1px solid #f5c6cb",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>
            Security Event Testing Controls
          </h3>

          <div
            style={{ marginBottom: "15px", fontSize: "14px", color: "#721c24" }}
          >
            Use these controls to simulate suspicious behavior that might
            trigger security binary events:
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <button
              onClick={() => {
                console.log("🧪 TEST: Rapid clicking simulation started");
                let clickCount = 0;
                const rapidClicks = setInterval(() => {
                  document.body.click();
                  clickCount++;
                  if (clickCount >= 50) {
                    clearInterval(rapidClicks);
                    console.log("🧪 TEST: Rapid clicking simulation complete");
                  }
                }, 10);
              }}
              style={{
                padding: "8px 12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🖱️ Rapid Clicking
            </button>

            <button
              onClick={() => {
                console.log("🧪 TEST: Mouse movement flooding started");
                let moveCount = 0;
                const rapidMoves = setInterval(() => {
                  const event = new MouseEvent("mousemove", {
                    clientX: Math.random() * window.innerWidth,
                    clientY: Math.random() * window.innerHeight,
                  });
                  document.dispatchEvent(event);
                  moveCount++;
                  if (moveCount >= 100) {
                    clearInterval(rapidMoves);
                    console.log("🧪 TEST: Mouse movement flooding complete");
                  }
                }, 5);
              }}
              style={{
                padding: "8px 12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🐭 Mouse Flooding
            </button>

            <button
              onClick={() => {
                console.log("🧪 TEST: Key spam started");
                let keyCount = 0;
                const keySpam = setInterval(() => {
                  const keys = ["a", "b", "c", "d", "e", "f"];
                  const randomKey =
                    keys[Math.floor(Math.random() * keys.length)];
                  const event = new KeyboardEvent("keydown", {
                    key: randomKey,
                  });
                  document.dispatchEvent(event);
                  keyCount++;
                  if (keyCount >= 50) {
                    clearInterval(keySpam);
                    console.log("🧪 TEST: Key spam complete");
                  }
                }, 20);
              }}
              style={{
                padding: "8px 12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ⌨️ Key Spam
            </button>

            <button
              onClick={() => {
                console.log("🧪 TEST: DOM manipulation started");
                for (let i = 0; i < 20; i++) {
                  setTimeout(() => {
                    const div = document.createElement("div");
                    div.style.display = "none";
                    div.innerHTML = `test-${i}`;
                    document.body.appendChild(div);
                    setTimeout(() => div.remove(), 100);
                  }, i * 50);
                }
                console.log("🧪 TEST: DOM manipulation scheduled");
              }}
              style={{
                padding: "8px 12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🏗️ DOM Manipulation
            </button>

            <button
              onClick={async () => {
                console.log("🧪 TEST: API flooding started");
                const promises: Promise<void | Response>[] = [];
                for (let i = 0; i < 10; i++) {
                  promises.push(
                    fetch("/api/player-heartbeat", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ test: true, iteration: i }),
                    }).catch(() => {}),
                  );
                }
                await Promise.all(promises);
                console.log("🧪 TEST: API flooding complete");
              }}
              style={{
                padding: "8px 12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🌊 API Flooding
            </button>

            <button
              onClick={() => {
                console.log("🧪 TEST: Automated behavior simulation started");
                // Simulate very regular, robotic behavior
                let step = 0;
                const roboticBehavior = setInterval(() => {
                  switch (step % 4) {
                    case 0:
                      document.body.click();
                      break;
                    case 1:
                      window.scrollBy(0, 100);
                      break;
                    case 2:
                      const event = new MouseEvent("mousemove", {
                        clientX: 500,
                        clientY: 300,
                      });
                      document.dispatchEvent(event);
                      break;
                    case 3:
                      const keyEvent = new KeyboardEvent("keydown", {
                        key: "ArrowDown",
                      });
                      document.dispatchEvent(keyEvent);
                      break;
                  }
                  step++;
                  if (step >= 100) {
                    // Increased from 40 to 100
                    clearInterval(roboticBehavior);
                    console.log(
                      "🧪 TEST: Automated behavior simulation complete",
                    );
                  }
                }, 50); // Reduced interval from 100ms to 50ms for more aggressive behavior
              }}
              style={{
                padding: "8px 12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🤖 Robotic Behavior
            </button>

            <button
              onClick={() => {
                console.log("🧪 TEST: SUPER AGGRESSIVE behavior started");
                // Combine multiple aggressive behaviors simultaneously

                // Rapid clicking
                let clickCount = 0;
                const rapidClicks = setInterval(() => {
                  document.body.click();
                  clickCount++;
                  if (clickCount >= 200) clearInterval(rapidClicks);
                }, 5);

                // Rapid mouse movements
                let moveCount = 0;
                const rapidMoves = setInterval(() => {
                  const event = new MouseEvent("mousemove", {
                    clientX: Math.random() * window.innerWidth,
                    clientY: Math.random() * window.innerHeight,
                  });
                  document.dispatchEvent(event);
                  moveCount++;
                  if (moveCount >= 300) clearInterval(rapidMoves);
                }, 2);

                // Key spam
                let keyCount = 0;
                const keySpam = setInterval(() => {
                  const keys = ["a", "b", "c", "d", "e", "f", "Tab", "Enter"];
                  const randomKey =
                    keys[Math.floor(Math.random() * keys.length)];
                  const event = new KeyboardEvent("keydown", {
                    key: randomKey,
                  });
                  document.dispatchEvent(event);
                  keyCount++;
                  if (keyCount >= 150) clearInterval(keySpam);
                }, 3);

                // DOM manipulation
                for (let i = 0; i < 50; i++) {
                  setTimeout(() => {
                    const div = document.createElement("div");
                    div.innerHTML = `aggressive-test-${i}`;
                    document.body.appendChild(div);
                    setTimeout(() => div.remove(), 50);
                  }, i * 10);
                }

                console.log("🧪 TEST: SUPER AGGRESSIVE behavior complete");
              }}
              style={{
                padding: "8px 12px",
                backgroundColor: "#6f42c1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ⚡ SUPER AGGRESSIVE
            </button>
          </div>

          <div
            style={{ fontSize: "12px", color: "#721c24", marginTop: "10px" }}
          >
            <p>
              ⚠️ <strong>Warning:</strong> These test buttons simulate
              suspicious behavior that security systems are designed to detect.
              Use responsibly for testing purposes only.
            </p>
          </div>
        </div>

        {/* Binary Score Monitor */}
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
            Binary Score Monitor
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <strong>Status:</strong>{" "}
            <span style={{ color: "#2d3436" }}>{riskStatus}</span>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <strong>Binary Score Events Captured:</strong> {riskScoreData.length}
            <div
              style={{ fontSize: "12px", color: "#856404", marginTop: "5px" }}
            >
              {riskScoreData.length === 0
                ? "No binary score events detected yet"
                : `${riskScoreData.length} binary score events captured`}
            </div>
          </div>

          {riskScoreData.length > 0 ? (
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
                {riskScoreData.map((event) => (
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
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginBottom: "5px",
                      }}
                    >
                      {event.timestamp}
                    </div>
                    <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                      Kind: {event.kind} (Block Decision)
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "bold",
                          color: "#d63031",
                          marginBottom: "5px",
                        }}
                      >
                        BINARY SCORE:{" "}
                        {typeof event.score === "object"
                          ? JSON.stringify(event.score)
                          : event.score}
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          color: "#636e72",
                          fontWeight: "bold",
                        }}
                      >
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
          ) : (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
                color: "#6c757d",
              }}
            >
              <div style={{ fontSize: "16px", marginBottom: "10px" }}>
                🔍 No binary score events detected
              </div>
              <div style={{ fontSize: "14px" }}>
                Binary events only fire when the security system determines
                blocking action is needed.
                <br />• Try the test buttons above to trigger suspicious
                behavior
                <br />• Normal browsing typically doesn't generate binary events
                <br />• The security system may be configured to only fire
                events under specific conditions
              </div>
            </div>
          )}

          <div style={{ marginTop: "15px", fontSize: "14px", color: "#666" }}>
            <p>
              🔍 <strong>Binary Score Monitoring:</strong>
              <br />
              This panel captures binary score events from the security system
              (block decisions only).
              <br />• <strong>Binary Score:</strong> Block decision values in
              red
              <br />• Hashed scores are not available in this configuration
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
