
export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { event, videoId, timestamp, duration, position } = body;

    // Simulate video analytics tracking
    const analyticsData = {
      eventId: Math.random().toString(36).substr(2, 9),
      videoId,
      event,
      timestamp: timestamp || Date.now(),
      position,
      duration,
      sessionId: Math.random().toString(36).substr(2, 16),
      userId: `user_${Math.floor(Math.random() * 10000)}`,
      processed: true,
    };

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

    return new Response(
      JSON.stringify({
        success: true,
        data: analyticsData,
        message: `${event} event tracked successfully`,
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
    console.error("Video analytics error:", error.message || error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to track analytics",
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
