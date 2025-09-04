export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { videoId, position, duration, quality, buffering } = req.body || {};

    // Simulate video heartbeat/progress tracking
    const heartbeatData = {
      heartbeatId: Math.random().toString(36).substr(2, 10),
      videoId,
      position: position || 0,
      duration: duration || 1800, // 30 minutes default
      quality:
        quality || ["720p", "1080p", "480p"][Math.floor(Math.random() * 3)],
      buffering: buffering || Math.random() < 0.1, // 10% chance of buffering
      bandwidth: Math.floor(Math.random() * 5000) + 1000, // 1-6 Mbps
      timestamp: Date.now(),
      watchTime: Math.floor(Math.random() * 1800),
      isActive: true,
    };

    // Simulate dynamic ad insertion decision
    const shouldShowAd = Math.random() < 0.15; // 15% chance of ad break

    res.setHeader("Cache-Control", "no-cache");
    return res.status(200).json({
      success: true,
      data: heartbeatData,
      adBreak: shouldShowAd
        ? {
            adId: `ad_${Math.floor(Math.random() * 1000)}`,
            duration: Math.floor(Math.random() * 30) + 15, // 15-45 second ads
            type: ["preroll", "midroll", "overlay"][
              Math.floor(Math.random() * 3)
            ],
          }
        : null,
      recommendations: Array.from({ length: 3 }, (_, i) => ({
        videoId: `video_${Math.floor(Math.random() * 10000)}`,
        title: `Recommended Video ${i + 1}`,
        duration: Math.floor(Math.random() * 3600) + 300,
      })),
    });
  } catch (error) {
    console.error("Video heartbeat error:", error.message || error);
    return res.status(500).json({
      success: false,
      message: "Failed to process heartbeat",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
