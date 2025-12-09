export const runtime = "edge";

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { videoId, position, duration, quality, buffering } = body;

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

    return new Response(
      JSON.stringify({
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
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      },
    );
  } catch (error) {
    console.error("Video heartbeat error:", error.message || error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to process heartbeat",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
