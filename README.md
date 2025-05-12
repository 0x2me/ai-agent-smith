# AI Agent Smith - Discord Content Scraper

A TypeScript application for scraping content from Discord channels using Selenium WebDriver.

## Features

- Headless browser automation with Selenium and ChromeDriver
- Login to Discord with credentials
- Navigate to specific Discord servers and channels
- Scrape messages, including author, content, timestamp, and attachments
- Save scraped data in multiple formats (JSON, CSV, TXT)
- Configurable via environment variables

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Chrome browser installed

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/0x2me/ai-agent-smith.git
   cd ai-agent-smith
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Discord credentials and configuration.

## Configuration

Edit the `.env` file to configure the application:

```
# Discord credentials
DISCORD_EMAIL=your_email@example.com
DISCORD_PASSWORD=your_password
DISCORD_SERVER_IDS=server_id_1,server_id_2
DISCORD_CHANNEL_IDS=channel_id_1,channel_id_2

# Selenium configuration
SELENIUM_HEADLESS=true
SELENIUM_IMPLICIT_WAIT_MS=10000

# Output configuration
OUTPUT_DIRECTORY=./data
OUTPUT_FILE_FORMAT=json  # json, csv, or txt
```

## Usage

1. Build the application:
   ```bash
   npm run build
   ```

2. Run the application:
   ```bash
   npm start
   ```

For development:
```bash
npm run dev
```

## Output

Scraped data will be saved in the configured output directory (default: `./data`) in the specified format.

### JSON Format Example

```json
[
  {
    "id": "message_id",
    "author": "User#1234",
    "content": "Hello, world!",
    "timestamp": "Today at 12:34 PM",
    "attachments": []
  }
]
```

## Project Structure

- `src/config/config.ts` - Configuration management
- `src/services/discord-scraper.ts` - Discord scraping functionality
- `src/utils/logger.ts` - Logging utilities
- `src/index.ts` - Main application entry point

## License

ISC
