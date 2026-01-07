export const runtime = "edge";

// Generate cryptographically secure random string
function generateSecureId(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(36))
    .join("")
    .substr(0, length);
}

// Generate cryptographically secure random number
function getSecureRandomNumber(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { event, videoId, timestamp, duration, position } = body;

    // Simulate video analytics tracking
    const analyticsData = {
      eventId: generateSecureId(9),
      videoId,
      event,
      timestamp: timestamp || Date.now(),
      position,
      duration,
      sessionId: crypto.randomUUID(),
      userId: `user_${getSecureRandomNumber(10000)}`,
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
