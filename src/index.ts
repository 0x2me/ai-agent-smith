import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import {
  getLatestVideoFromChannel,
  getChannelVideos,
  getAllChannels,
} from "./services/youtube.service";

dotenv.config();

const server = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
    },
  },
});

server.register(cors, {
  origin: true,
});

// Health check endpoint
server.get("/health", async () => {
  return { status: "ok" };
});

// Get all channels
server.get("/channels", async () => {
  try {
    const channels = await getAllChannels();
    return { channels };
  } catch (error) {
    server.log.error(error);
    throw { statusCode: 500, message: "Error fetching channels" };
  }
});

// Get videos for a specific channel
server.get("/channels/:channelId/videos", async (request, reply) => {
  const { channelId } = request.params as { channelId: string };

  try {
    const videos = await getChannelVideos(channelId);
    return { videos };
  } catch (error) {
    server.log.error(error);
    throw { statusCode: 500, message: "Error fetching videos" };
  }
});

// Fetch latest videos for a channel
server.post("/channels/:channelId/fetch", async (request, reply) => {
  const { channelId } = request.params as { channelId: string };

  try {
    await getLatestVideoFromChannel(channelId);
    return {
      success: true,
      message: `Successfully fetched latest videos for channel ${channelId}`,
    };
  } catch (error) {
    server.log.error(error);
    throw { statusCode: 500, message: "Error fetching latest videos" };
  }
});

// Start the server
const start = async () => {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });
    const address = server.server.address();
    const port = typeof address === "string" ? address : address?.port;

    console.log(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
