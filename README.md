# YouTube Video Service

A service that fetches the latest videos from YouTube channels, including their transcripts, and stores them in a PostgreSQL database using Prisma.

## Features

- Fetch latest videos from a YouTube channel
- Store video metadata and transcripts in PostgreSQL database
- CLI for fetching and managing videos
- REST API for accessing the data

## Prerequisites

- Node.js and Yarn
- PostgreSQL database
- YouTube Data API key

## Setup

1. Install dependencies:
   ```
   yarn install
   ```

2. Set up environment variables:
   - Create a `.env` file with the following:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/youtube_service?schema=public"
   YOUTUBE_API_KEY="your-youtube-api-key"
   ```

3. Set up the database:
   ```
   yarn prisma:migrate
   ```

4. Generate Prisma client:
   ```
   yarn prisma:generate
   ```

## Usage

### Start API Server

```
yarn dev
```

The server will start at http://localhost:3000

### Using the CLI

The CLI provides commands to fetch and view YouTube videos and transcripts:

1. Fetch videos from a channel:
   ```
   yarn cli fetch UC_x5XG1OV2P6uZZ5FSM9Ttw
   ```

2. List videos from a channel:
   ```
   yarn cli list UC_x5XG1OV2P6uZZ5FSM9Ttw
   ```

3. List videos with transcript preview:
   ```
   yarn cli list UC_x5XG1OV2P6uZZ5FSM9Ttw --with-transcript
   ```

4. Get full transcript for a video:
   ```
   yarn cli transcript dQw4w9WgXcQ
   ```

### API Endpoints

- `GET /health` - Health check
- `GET /channels` - Get all stored channels
- `GET /channels/:channelId/videos` - Get all videos for a channel
- `POST /channels/:channelId/fetch` - Fetch latest videos for a channel

## Development

- Run in development mode: `yarn dev`
- Access Prisma Studio to view database: `yarn prisma:studio`
