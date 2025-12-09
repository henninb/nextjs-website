export const runtime = "edge";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const videoId = url.searchParams.get("videoId");
    const currentVideoId =
      videoId || `video_${Math.floor(Math.random() * 1000)}`;

    // Simulate video metadata
    const videoMetadata = {
      videoId: currentVideoId,
      title: `Sample Video ${currentVideoId}`,
      description:
        "This is a sample video for testing the video player prototype.",
      duration: Math.floor(Math.random() * 3600) + 300, // 5 minutes to 1 hour
      thumbnailUrl: `https://picsum.photos/1280/720?random=${Math.floor(Math.random() * 1000)}`,
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      quality: ["480p", "720p", "1080p"],
      category: ["Technology", "Gaming", "Education", "Entertainment"][
        Math.floor(Math.random() * 4)
      ],
      views: Math.floor(Math.random() * 1000000),
      likes: Math.floor(Math.random() * 50000),
      uploadDate: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      author: {
        id: `author_${Math.floor(Math.random() * 100)}`,
        name: `Content Creator ${Math.floor(Math.random() * 100)}`,
        subscribers: Math.floor(Math.random() * 500000),
      },
      tags: ["sample", "video", "test", "prototype"],
      chapters: Array.from(
        { length: Math.floor(Math.random() * 8) + 2 },
        (_, i) => ({
          time: i * 300,
          title: `Chapter ${i + 1}`,
          description: `This is chapter ${i + 1} of the video`,
        }),
      ),
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: videoMetadata,
        recommendations: Array.from({ length: 6 }, (_, i) => ({
          videoId: `video_${Math.floor(Math.random() * 10000)}`,
          title: `Related Video ${i + 1}`,
          thumbnailUrl: `https://picsum.photos/320/180?random=${Math.floor(Math.random() * 1000)}`,
          duration: Math.floor(Math.random() * 1800) + 300,
          views: Math.floor(Math.random() * 100000),
          author: `Creator ${Math.floor(Math.random() * 50)}`,
        })),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Video metadata error:", error.message || error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch video metadata",
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

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const videoId = body.videoId;
    const currentVideoId =
      videoId || `video_${Math.floor(Math.random() * 1000)}`;

    // Simulate video metadata
    const videoMetadata = {
      videoId: currentVideoId,
      title: `Sample Video ${currentVideoId}`,
      description:
        "This is a sample video for testing the video player prototype.",
      duration: Math.floor(Math.random() * 3600) + 300, // 5 minutes to 1 hour
      thumbnailUrl: `https://picsum.photos/1280/720?random=${Math.floor(Math.random() * 1000)}`,
      videoUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      quality: ["480p", "720p", "1080p"],
      category: ["Technology", "Gaming", "Education", "Entertainment"][
        Math.floor(Math.random() * 4)
      ],
      views: Math.floor(Math.random() * 1000000),
      likes: Math.floor(Math.random() * 50000),
      uploadDate: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      author: {
        id: `author_${Math.floor(Math.random() * 100)}`,
        name: `Content Creator ${Math.floor(Math.random() * 100)}`,
        subscribers: Math.floor(Math.random() * 500000),
      },
      tags: ["sample", "video", "test", "prototype"],
      chapters: Array.from(
        { length: Math.floor(Math.random() * 8) + 2 },
        (_, i) => ({
          time: i * 300,
          title: `Chapter ${i + 1}`,
          description: `This is chapter ${i + 1} of the video`,
        }),
      ),
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: videoMetadata,
        recommendations: Array.from({ length: 6 }, (_, i) => ({
          videoId: `video_${Math.floor(Math.random() * 10000)}`,
          title: `Related Video ${i + 1}`,
          thumbnailUrl: `https://picsum.photos/320/180?random=${Math.floor(Math.random() * 1000)}`,
          duration: Math.floor(Math.random() * 1800) + 300,
          views: Math.floor(Math.random() * 100000),
          author: `Creator ${Math.floor(Math.random() * 50)}`,
        })),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Video metadata error:", error.message || error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch video metadata",
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
