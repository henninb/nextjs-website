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
  const [pxScoreData, setPxScoreData] = useState<any[]>([]);
  const [pxAllEvents, setPxAllEvents] = useState<any[]>([]);
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
  // PX detection retry control
  const pxRetryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pxRetryAttemptsRef = useRef(0);
  const pxErrorHandlerRef = useRef<((ev: ErrorEvent) => void) | null>(null);

  // Prevent multiple PX setups due to React strict mode
  const pxSetupRef = useRef(false);

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

  // PX Risk Event Listener Setup
  useEffect(() => {
    // Prevent multiple setups due to React strict mode/HMR
    if (pxSetupRef.current) {
      console.log("🚫 PX setup already done, skipping to prevent duplication");
      return;
    }
    pxSetupRef.current = true;

    const setupPxListener = () => {
      console.log("🔧 Setting up PX event listener...");
      setPxStatus("Setting up PX event listener...");

      // Page + script loading diagnostics
      console.log("🕒 Document.readyState:", document.readyState);
      const pxScript = document.getElementById("px-script") as HTMLScriptElement | null;
      if (pxScript) {
        console.log("🔎 Found px-script element:", {
          src: pxScript.getAttribute("src"),
          async: pxScript.async,
          defer: pxScript.defer,
          dataset_app_id: (pxScript as any).dataset?.appId,
          hasLoadListener: true,
        });
        // Attach runtime listeners for load/error if not already attached
        pxScript.addEventListener("load", () => {
          console.log("[PX-DIAG] px-script onload observed from watch page");
        });
        pxScript.addEventListener("error", (e) => {
          console.error("[PX-DIAG] px-script onerror observed from watch page", e);
          setPxStatus("PX script failed to load");
        });
      } else {
        console.warn("[PX-DIAG] px-script element not found in DOM");
      }

      // Global resource error trap (helps catch network/script failures)
      const onResError = (ev: ErrorEvent) => {
        const tgt = ev.target as any;
        if (tgt && tgt.tagName === "SCRIPT" && typeof tgt.src === "string" && tgt.src.includes("px-cloud")) {
          console.error("[PX-DIAG] Global script error for PX resource:", tgt.src, ev);
          setPxStatus("PX network/script error");
        }
      };
      window.addEventListener("error", onResError, true);
      pxErrorHandlerRef.current = onResError;

      // Set up the PX async init function
      if ((window as any).PXjJ0cYtn9_asyncInit) {
        console.warn("[PX-DIAG] PXjJ0cYtn9_asyncInit already exists on window; will overwrite to ensure logging");
      }
      (window as any).PXjJ0cYtn9_asyncInit = function (px: any) {
        console.log("🎯 PXjJ0cYtn9_asyncInit called with PX object:", px);
        console.log("🔍 PX object type:", typeof px);
        console.log(
          "🔍 PX object keys:",
          px ? Object.keys(px) : "null/undefined",
        );

        // Validate that the PX object has Events API
        if (!px || !px.Events || typeof px.Events.on !== "function") {
          console.error("❌ PX object does not have Events API:", px);
          console.log("❌ px.Events:", px ? px.Events : "px is null/undefined");
          console.log(
            "❌ px.Events.on type:",
            px && px.Events ? typeof px.Events.on : "N/A",
          );
          setPxStatus(
            "PX object missing Events API - score monitoring unavailable",
          );
          return;
        }

        console.log("✅ PX object validation passed, Events API available");
        console.log("🔍 Events object:", px.Events);
        console.log("🔍 Events.on function:", px.Events.on);

        setPxStatus("PX initialized - listening for all events...");

        // CRITICAL: First, let's see what events PX actually supports
        console.log(
          "🔍 DEBUGGING: Available PX Events methods:",
          Object.keys(px.Events),
        );
        console.log("🔍 DEBUGGING: PX object inspection:", px);

        // Try to trigger a test score manually to see if the event works
        if (px.Events.trigger) {
          console.log("🧪 TESTING: Manually triggering test score event");
          try {
            px.Events.trigger("score", "test-score", "binary");
          } catch (e) {
            console.log("🧪 Manual trigger failed:", e);
          }
        }

        // CRITICAL: Set up the exact score listener as per PX documentation
        console.log(
          "🎯 Setting up OFFICIAL PX score listener with (score, kind) signature...",
        );

        // Try multiple variations to catch any score event
        const scoreHandler = function (score, kind) {
          console.log(
            `🏆 OFFICIAL SCORE EVENT FIRED!!! - Score: ${score}, Kind: ${kind}`,
          );
          console.log(
            `🏆 Score type: ${typeof score}, Kind type: ${typeof kind}`,
          );
          console.log(
            `🏆 Arguments length: ${arguments.length}, All arguments:`,
            Array.from(arguments),
          );

          if (kind === "binary") {
            console.log("🚫 BINARY BLOCK DECISION DETECTED:", score);

            const scoreEvent = {
              timestamp: new Date().toISOString(),
              kind: kind,
              score: score,
              id: Date.now() + Math.random(),
            };

            setPxScoreData((prev) => {
              const newData = [scoreEvent, ...prev.slice(0, 9)];
              return newData;
            });

            const statusMessage = `BINARY BLOCK DECISION: ${score} - ${new Date().toLocaleTimeString()}`;
            setPxStatus(statusMessage);
            showToast(`🚫 PX Block Decision: ${score}`);
          } else {
            console.log(
              `📊 Non-binary score event - Score: ${score}, Kind: ${kind}`,
            );
          }
        };

        px.Events.on("score", scoreHandler);

        // Also explicitly map 'risk' to a score-like handler if provided by SDK
        try {
          px.Events.on("risk", function (...args: any[]) {
            console.log("🧭 RISK event observed; arguments:", args);
            // Heuristic: some SDKs emit [token, cookieName, score, threshold]
            const maybeScore = args?.[2];
            const maybeThreshold = args?.[3];
            if (maybeScore !== undefined) {
              const scoreEvent = {
                timestamp: new Date().toISOString(),
                kind: "risk",
                score: maybeScore,
                threshold: maybeThreshold,
                id: Date.now() + Math.random(),
              } as any;
              console.log("🧭 Mapped risk->score candidate:", scoreEvent);
              setPxScoreData((prev) => [scoreEvent, ...prev.slice(0, 9)]);
              setPxStatus(
                `Risk score observed: ${maybeScore} (thr=${maybeThreshold ?? "?"}) - ${new Date().toLocaleTimeString()}`,
              );
            }
          });
          console.log("✅ Explicit 'risk' to score mapping listener installed");
        } catch (e) {
          console.log("ℹ️ Could not attach explicit 'risk' listener:", e);
        }

        // Helper function to log and store any PX event
        const logPxEvent = (eventType: string, ...args: any[]) => {
          console.log(`🚨 PX EVENT FIRED: ${eventType}`);
          console.log(`🚨 Arguments (${args.length}):`, args);

          const eventData = {
            timestamp: new Date().toISOString(),
            type: eventType,
            args: args,
            id: Date.now() + Math.random(),
          };

          console.log("📦 Created event object:", eventData);

          // Store all events for debugging
          setPxAllEvents((prev) => {
            const newData = [eventData, ...prev.slice(0, 19)]; // Keep last 20 events
            return newData;
          });

          // Special handling for score events (case insensitive)
          const eventTypeLower = eventType.toLowerCase();

          if (eventTypeLower === "score" && args.length >= 2) {
            const [score, kind] = args;
            console.log(`🎯 SCORE EVENT - Score: ${score}, Kind: ${kind}`);

            // Check for binary kind (case insensitive)
            const kindStr = String(kind).toLowerCase();
            if (
              kindStr === "binary" ||
              kindStr === "block" ||
              kindStr === "blocked"
            ) {
              console.log("✅ Processing binary score:", score);

              const scoreEvent = {
                timestamp: new Date().toISOString(),
                kind: kind,
                score: score,
                id: Date.now() + Math.random(),
              };

              setPxScoreData((prev) => {
                const newData = [scoreEvent, ...prev.slice(0, 9)];
                return newData;
              });

              const statusMessage = `Binary score captured: ${score} - ${new Date().toLocaleTimeString()}`;
              setPxStatus(statusMessage);
              showToast(`PX Binary Score: ${score}`);
            }
          }

          // Also check for direct binary/block events
          if (
            eventTypeLower === "binary" ||
            eventTypeLower === "block" ||
            eventTypeLower === "blocked"
          ) {
            console.log(
              `🚫 DIRECT BLOCK EVENT - Type: ${eventType}, Args:`,
              args,
            );

            const blockEvent = {
              timestamp: new Date().toISOString(),
              kind: eventType,
              score: args[0] || "BLOCKED",
              id: Date.now() + Math.random(),
            };

            setPxScoreData((prev) => {
              const newData = [blockEvent, ...prev.slice(0, 9)];
              return newData;
            });

            const statusMessage = `Block event captured: ${eventType} - ${new Date().toLocaleTimeString()}`;
            setPxStatus(statusMessage);
            showToast(`PX Block Event: ${eventType}`);
          }

          // Update status with latest event
          const statusMessage = `Last event: ${eventType} - ${new Date().toLocaleTimeString()}`;
          setPxStatus(statusMessage);
        };

        try {
          console.log("🔌 Setting up comprehensive PX event listeners...");

          // List of common PX event types to listen for (including case variations)
          // EXCLUDE 'score' to prevent overriding our official score listener!
          const eventTypes = [
            // "score", "Score", "SCORE", // REMOVED - using official listener above
            "risk",
            "Risk",
            "RISK",
            "challenge",
            "Challenge",
            "CHALLENGE",
            "block",
            "Block",
            "BLOCK",
            "captcha",
            "Captcha",
            "CAPTCHA",
            "detection",
            "Detection",
            "DETECTION",
            "behavioral",
            "Behavioral",
            "BEHAVIORAL",
            "fingerprint",
            "Fingerprint",
            "FINGERPRINT",
            "telemetry",
            "Telemetry",
            "TELEMETRY",
            "activity",
            "Activity",
            "ACTIVITY",
            "violation",
            "Violation",
            "VIOLATION",
            "anomaly",
            "Anomaly",
            "ANOMALY",
            "threat",
            "Threat",
            "THREAT",
            "security",
            "Security",
            "SECURITY",
            "binary",
            "Binary",
            "BINARY",
            "blocked",
            "Blocked",
            "BLOCKED",
          ];

          // Set up listeners for all known event types
          eventTypes.forEach((eventType) => {
            try {
              console.log(`🎯 Setting up listener for: ${eventType}`);
              px.Events.on(eventType, function (...args: any[]) {
                logPxEvent(eventType, ...args);
              });
            } catch (err) {
              console.log(
                `⚠️ Could not set up listener for ${eventType}:`,
                err,
              );
            }
          });

          // Also try to intercept any other events by monkey-patching the trigger method
          if (px.Events.trigger) {
            const originalTrigger = px.Events.trigger;
            px.Events.trigger = function (eventType: string, ...args: any[]) {
              console.log(`🔥 PX TRIGGER INTERCEPTED: ${eventType}`, args);
              logPxEvent(`trigger:${eventType}`, ...args);
              return originalTrigger.apply(this, arguments);
            };
            console.log(
              "✅ Monkey-patched Events.trigger for complete event capture",
            );
          }

          // Try to subscribe to channels if supported by this SDK variant
          try {
            const hasChannels = px.Events && typeof (px.Events as any).channels === "function";
            const hasSubscribe = px.Events && typeof (px.Events as any).subscribe === "function";
            console.log("🔎 Channels support:", { hasChannels, hasSubscribe });
            if (hasChannels) {
              let channelsInfo: any;
              try {
                channelsInfo = (px.Events as any).channels();
              } catch (err) {
                console.log("ℹ️ Calling Events.channels() failed:", err);
              }
              console.log("🔎 Events.channels() returned:", channelsInfo);
            }
            if (hasSubscribe) {
              try {
                (px.Events as any).subscribe("*", function (...args: any[]) {
                  console.log("📡 CHANNEL subscribe('*') event:", args);
                  logPxEvent("channel:*", ...args);
                });
                console.log("✅ Subscribed to channel wildcard via Events.subscribe('*')");
              } catch (err) {
                console.log("ℹ️ Channel wildcard subscription not supported:", err);
              }
            }
          } catch (err) {
            console.log("ℹ️ Channel diagnostics not available:", err);
          }

          // Try to listen for all events using a wildcard or generic listener if available
          try {
            px.Events.on("*", function (eventType: string, ...args: any[]) {
              logPxEvent(`wildcard:${eventType}`, ...args);
            });
            console.log("✅ Wildcard event listener set up");
          } catch (err) {
            console.log("ℹ️ Wildcard listener not supported:", err);
          }

          console.log("✅ Comprehensive PX event listener setup complete");
          console.log("🔍 Now monitoring for all PX events...");
        } catch (error) {
          console.error("❌ Error setting up PX event listeners:", error);
          setPxStatus("Error setting up PX event listeners");
        }
      };

      // Check if PX is already loaded (try different variations, but only use ones with Events API)
      console.log("🔍 Checking for existing PX objects...");

      const pxCandidates = [
        { name: "window.px", obj: (window as any).px },
        { name: "window.PX", obj: (window as any).PX },
        { name: "window.PXjJ0cYtn9", obj: (window as any).PXjJ0cYtn9 },
        { name: "window._PXjJ0cYtn9", obj: (window as any)._PXjJ0cYtn9 },
      ];

      console.log("🔍 PX candidates found:");
      pxCandidates.forEach((candidate) => {
        console.log(
          `  ${candidate.name}:`,
          !!candidate.obj,
          candidate.obj ? typeof candidate.obj : "undefined",
        );
        if (candidate.obj) {
          console.log(`    Keys:`, Object.keys(candidate.obj));
          console.log(`    Has Events:`, !!candidate.obj.Events);
          console.log(
            `    Events.on type:`,
            candidate.obj.Events ? typeof candidate.obj.Events.on : "N/A",
          );
        }
      });

      const validCandidates = pxCandidates
        .filter((c) => c.obj)
        .map((c) => c.obj);
      const pxObject = validCandidates.find(
        (px) => px && px.Events && typeof px.Events.on === "function",
      );

      if (pxObject) {
        console.log(
          "✅ Found PX object with Events API, calling asyncInit with:",
          pxObject,
        );
        console.log("🔍 Events methods:", Object.keys(pxObject.Events));
        (window as any).PXjJ0cYtn9_asyncInit(pxObject);
      } else {
        console.log(
          "⏳ No PX object with Events API found yet, waiting for async init callback",
        );
        if (validCandidates.length > 0) {
          console.log(
            "📋 Found PX objects but without Events API:",
            validCandidates,
          );
        } else {
          console.log("📋 No PX objects found at all");
        }

        // Start a bounded retry loop to detect PX after script loads
        const maxAttempts = 120; // ~60s at 500ms
        if (!pxRetryIntervalRef.current) {
          console.log("[PX-DIAG] Starting PX detection retry loop");
          pxRetryAttemptsRef.current = 0;
          pxRetryIntervalRef.current = setInterval(() => {
            pxRetryAttemptsRef.current += 1;
            const candidates = [
              (window as any).px,
              (window as any).PX,
              (window as any).PXjJ0cYtn9,
              (window as any)._PXjJ0cYtn9,
            ];
            const found = candidates.find(
              (p) => p && p.Events && typeof p.Events.on === "function",
            );
            if (found) {
              console.log(
                `[PX-DIAG] PX detected on attempt #${pxRetryAttemptsRef.current}; initializing...`,
                found,
              );
              try {
                (window as any).PXjJ0cYtn9_asyncInit(found);
              } finally {
                if (pxRetryIntervalRef.current) clearInterval(pxRetryIntervalRef.current);
                pxRetryIntervalRef.current = null;
              }
            } else if (pxRetryAttemptsRef.current % 10 === 0) {
              console.log(
                `[PX-DIAG] Still waiting for PX (attempt ${pxRetryAttemptsRef.current}/${maxAttempts})`
              );
            }
            if (pxRetryAttemptsRef.current >= maxAttempts) {
              if (pxRetryIntervalRef.current) clearInterval(pxRetryIntervalRef.current);
              pxRetryIntervalRef.current = null;
              console.warn("[PX-DIAG] PX not detected after retry window");
              setPxStatus("PX not detected after waiting");
            }
          }, 500);
        }
      }
    };

    console.log("🚀 Starting PX listener setup...");
    setupPxListener();
    console.log("✅ PX listener setup initiated");

    return () => {
      console.log("🧹 Cleaning up PX async init function...");
      // Cleanup - remove the function
      if ((window as any).PXjJ0cYtn9_asyncInit) {
        delete (window as any).PXjJ0cYtn9_asyncInit;
        console.log("✅ PX async init function cleaned up");
      }
      // Clear PX detection retries
      if (pxRetryIntervalRef.current) {
        clearInterval(pxRetryIntervalRef.current);
        pxRetryIntervalRef.current = null;
      }
      // Remove global resource error trap
      if (pxErrorHandlerRef.current) {
        window.removeEventListener("error", pxErrorHandlerRef.current as any, true);
        pxErrorHandlerRef.current = null;
      }
      // Reset setup ref for re-initialization
      pxSetupRef.current = false;
    };
  }, []);

  // Debug: Log whenever pxScoreData changes
  useEffect(() => {
    console.log("📊 pxScoreData state changed:", pxScoreData);
    console.log("📊 pxScoreData length:", pxScoreData.length);
    if (pxScoreData.length > 0) {
      console.log("📊 Latest score event:", pxScoreData[0]);
    }
  }, [pxScoreData]);

  // Debug: Log whenever pxAllEvents changes
  useEffect(() => {
    console.log("🎯 pxAllEvents state changed:", pxAllEvents);
    console.log("🎯 pxAllEvents length:", pxAllEvents.length);
    if (pxAllEvents.length > 0) {
      console.log("🎯 Latest PX event:", pxAllEvents[0]);
    }
  }, [pxAllEvents]);

  // Debug: Log whenever pxStatus changes
  useEffect(() => {
    console.log("📱 pxStatus changed:", pxStatus);
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

        {/* PX Testing Panel */}
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
            PX Event Testing Controls
          </h3>

          <div
            style={{ marginBottom: "15px", fontSize: "14px", color: "#721c24" }}
          >
            Use these controls to simulate suspicious behavior that might
            trigger PX binary events:
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
                const promises = [];
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

        {/* All PX Events Monitor */}
        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            backgroundColor: "#d1ecf1",
            borderRadius: "8px",
            border: "1px solid #bee5eb",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
            All PX Events Monitor (Debug)
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <strong>Status:</strong>{" "}
            <span style={{ color: "#0c5460" }}>{pxStatus}</span>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <strong>Total Events Captured:</strong> {pxAllEvents.length}
            <div
              style={{ fontSize: "12px", color: "#0c5460", marginTop: "5px" }}
            >
              This includes ALL PX events, not just binary scores
            </div>
          </div>

          {pxAllEvents.length > 0 ? (
            <div>
              <h4 style={{ margin: "15px 0 10px 0", fontSize: "16px" }}>
                Recent Events (All Types):
              </h4>
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "1px solid #b8daff",
                  borderRadius: "4px",
                  padding: "10px",
                  backgroundColor: "#fff",
                }}
              >
                {pxAllEvents.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    style={{
                      marginBottom: "10px",
                      padding: "10px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "4px",
                      borderLeft: `4px solid ${event.type === "score" ? "#ff6b6b" : "#74c0fc"}`,
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
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: "5px",
                        color: "#0c5460",
                      }}
                    >
                      Event Type: {event.type}
                    </div>
                    <div>
                      <strong>Arguments ({event.args.length}):</strong>
                      <pre
                        style={{
                          backgroundColor: "#2d3436",
                          color: "#ddd",
                          padding: "8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          marginTop: "5px",
                          overflow: "auto",
                          maxHeight: "150px",
                        }}
                      >
                        {JSON.stringify(event.args, null, 2)}
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
                ⏳ No PX events detected yet
              </div>
              <div style={{ fontSize: "14px" }}>
                This could mean:
                <br />• PX is not firing events for normal browsing behavior
                <br />• Try using the test buttons above to trigger suspicious
                behavior
                <br />• PX might be configured differently than expected
              </div>
            </div>
          )}

          <div
            style={{ marginTop: "15px", fontSize: "14px", color: "#0c5460" }}
          >
            <p>
              🔍 <strong>All PX Event Monitoring:</strong>
              <br />
              This panel shows ALL events fired by PX, including score, risk,
              challenge, and other event types.
              <br />
              • Events are captured in real-time using comprehensive listeners
              <br />• Binary score events (if any) will appear here AND in the
              dedicated panel below
            </p>
          </div>
        </div>

        {/* PX Binary Score Monitor */}
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
            PX Binary Score Monitor (Dedicated)
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <strong>Status:</strong>{" "}
            <span style={{ color: "#2d3436" }}>{pxStatus}</span>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <strong>Binary Score Events Captured:</strong> {pxScoreData.length}
            <div
              style={{ fontSize: "12px", color: "#856404", marginTop: "5px" }}
            >
              {pxScoreData.length === 0 && pxAllEvents.length === 0
                ? "No events detected - PX may not be firing events yet"
                : pxScoreData.length === 0 && pxAllEvents.length > 0
                  ? `No binary events, but ${pxAllEvents.length} other PX events detected`
                  : `${pxScoreData.length} binary score events captured`}
            </div>
          </div>

          {pxScoreData.length > 0 ? (
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
                {pxAllEvents.length === 0
                  ? "🔍 No PX events detected"
                  : "⏳ No binary score events detected"}
              </div>
              <div style={{ fontSize: "14px" }}>
                {pxAllEvents.length === 0 ? (
                  <>
                    PX may not be firing events yet. Try:
                    <br />• Using the test buttons above to trigger suspicious
                    behavior
                    <br />• Refreshing the page and trying again
                    <br />• PX might be configured to only fire events under
                    specific conditions
                  </>
                ) : (
                  <>
                    PX is working ({pxAllEvents.length} events detected) but no
                    binary scores yet.
                    <br />• Binary events only fire when PX determines blocking
                    action is needed
                    <br />• Try the test buttons above to trigger more
                    suspicious behavior
                    <br />• Normal browsing typically doesn't generate binary
                    events
                  </>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: "15px", fontSize: "14px", color: "#666" }}>
            <p>
              🔍 <strong>PerimeterX Binary Score Monitoring:</strong>
              <br />
              This panel captures binary score events from PerimeterX (block
              decisions only).
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
