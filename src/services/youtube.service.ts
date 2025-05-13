import { PrismaClient } from "@prisma/client";
import axios from "axios";
import dotenv from "dotenv";
import { YoutubeTranscript } from "youtube-transcript";

dotenv.config();

const prisma = new PrismaClient();
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  throw new Error("YOUTUBE_API_KEY is not defined in .env file");
}

// YouTube API response interface
interface YouTubeVideoResponse {
  id: { videoId: string };
  snippet: {
    channelId: string;
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
}

export async function getLatestVideoFromChannel(
  channelId: string
): Promise<void> {
  // This function now fetches only the single latest video from a channel
  try {
    // First, check if the channel exists in our database
    let channel = await prisma.youTubeChannel.findUnique({
      where: { channelId },
    });

    if (!channel) {
      // Fetch channel details from YouTube API
      const channelResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
      );

      if (channelResponse.data.items.length === 0) {
        throw new Error(`Channel with ID ${channelId} not found`);
      }

      const channelData = channelResponse.data.items[0].snippet;

      // Create channel in database
      channel = await prisma.youTubeChannel.create({
        data: {
          channelId,
          title: channelData.title,
          description: channelData.description,
        },
      });
    }

    // Fetch only the latest video from the channel
    const videosResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=1&order=date&type=video&key=${YOUTUBE_API_KEY}`
    );

    const videos = videosResponse.data.items as YouTubeVideoResponse[];

    // Process each video
    for (const video of videos) {
      const videoId = video.id.videoId;

      // Check if video already exists in database
      const existingVideo = await prisma.youTubeVideo.findUnique({
        where: { videoId },
      });

      if (!existingVideo) {
        // Try to get transcript
        let transcript = null;
        try {
          const transcriptData = await YoutubeTranscript.fetchTranscript(
            videoId
          );
          if (transcriptData && transcriptData.length > 0) {
            transcript = transcriptData
              .map((item) => `[${item.offset}] ${item.text}`)
              .join("\n");
          }
        } catch (error) {
          const transcriptError = error as Error;
          console.warn(
            `Could not fetch transcript for video ${videoId}:`,
            transcriptError.message
          );
        }

        // Store new video in database
        await prisma.youTubeVideo.create({
          data: {
            videoId,
            channelId: video.snippet.channelId,
            title: video.snippet.title,
            description: video.snippet.description,
            publishedAt: new Date(video.snippet.publishedAt),
            thumbnailUrl: video.snippet.thumbnails.high.url,
            transcript,
          },
        });
        console.log(`Added new video: ${video.snippet.title}`);
      }
    }

    console.log(
      `Successfully fetched and processed the latest video for channel ${channelId}`
    );
  } catch (error) {
    console.error("Error fetching videos:", error);
    throw error;
  }
}

export async function getChannelVideos(channelId: string) {
  return prisma.youTubeVideo.findMany({
    where: { channelId },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getAllChannels() {
  return prisma.youTubeChannel.findMany();
}
