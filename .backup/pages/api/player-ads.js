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
    const { adId, event, videoId, adPosition } = body;

    // Simulate ad tracking events (impression, click, complete, etc.)
    const adEvents = [
      "impression",
      "start",
      "quartile_1",
      "midpoint",
      "quartile_3",
      "complete",
      "click",
    ];
    const randomEvent =
      event || adEvents[Math.floor(Math.random() * adEvents.length)];

    const trackingData = {
      trackingId: Math.random().toString(36).substr(2, 12),
      adId: adId || `ad_${Math.floor(Math.random() * 1000)}`,
      event: randomEvent,
      videoId,
      adPosition:
        adPosition ||
        ["preroll", "midroll", "postroll"][Math.floor(Math.random() * 3)],
      timestamp: Date.now(),
      revenue: Math.random() * 0.05, // Simulate ad revenue
      campaignId: `campaign_${Math.floor(Math.random() * 100)}`,
      advertiserId: `advertiser_${Math.floor(Math.random() * 50)}`,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: trackingData,
        message: `Ad ${randomEvent} tracked successfully`,
        nextAdIn: Math.floor(Math.random() * 300) + 60, // Next ad in 60-360 seconds
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
    console.error("Ad tracking error:", error.message || error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to track ad event",
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
