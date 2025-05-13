#!/usr/bin/env node
import { Command } from "commander";
import {
  getLatestVideoFromChannel,
  getChannelVideos,
} from "./services/youtube.service";
import { PrismaClient, YouTubeVideo } from "@prisma/client";

const program = new Command();
const prisma = new PrismaClient();

program
  .name("youtube-service-cli")
  .description("CLI for YouTube video and transcript fetching service")
  .version("1.0.0");

program
  .command("fetch")
  .description("Fetch latest videos from a YouTube channel")
  .argument("<channelId>", "YouTube channel ID")
  .action(async (channelId: string) => {
    try {
      console.log(`Fetching latest videos for channel ${channelId}...`);
      await getLatestVideoFromChannel(channelId);
      console.log("Videos fetched successfully!");
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command("list")
  .description("List all videos from a YouTube channel")
  .argument("<channelId>", "YouTube channel ID")
  .option("-t, --with-transcript", "Show transcripts for each video")
  .action(async (channelId: string, options: { withTranscript?: boolean }) => {
    try {
      console.log(`Listing videos for channel ${channelId}...`);
      const videos = await getChannelVideos(channelId);

      if (videos.length === 0) {
        console.log("No videos found for this channel.");
        return;
      }

      console.log(`Found ${videos.length} videos:`);

      for (const video of videos) {
        console.log(`\n- Title: ${video.title}`);
        console.log(`  Video ID: ${video.videoId}`);
        console.log(`  Published: ${video.publishedAt.toLocaleDateString()}`);

        if (options.withTranscript && video.transcript) {
          console.log("\n  --- Transcript Preview ---");
          // Show first 200 chars of transcript as preview
          console.log(`  ${video.transcript.substring(0, 200)}...`);
          console.log("  --- End of Preview ---");
        }
      }
    } catch (error) {
      console.error("Error listing videos:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command("transcript")
  .description("Get transcript for a specific YouTube video")
  .argument("<videoId>", "YouTube video ID")
  .action(async (videoId: string) => {
    try {
      const video = await prisma.youTubeVideo.findUnique({
        where: { videoId },
      });

      if (!video) {
        console.log(`Video with ID ${videoId} not found in database.`);
        return;
      }

      if (!video.transcript) {
        console.log(`No transcript available for video: ${video.title}`);
        return;
      }

      console.log(`\nTranscript for: ${video.title}\n`);
      console.log(video.transcript);
    } catch (error) {
      console.error("Error fetching transcript:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

program.parse();
