import fs from 'fs';
import path from 'path';
import { DiscordScraper } from './services/discord-scraper';
import config from './config/config';
import { Logger, LogLevel } from './utils/logger';

const logger = new Logger('Main', LogLevel.INFO);

const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  logger.info('Creating sample .env file');
  const sampleEnv = `# Discord credentials
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
`;
  fs.writeFileSync(envPath, sampleEnv);
  logger.info(`Created sample .env file at ${envPath}`);
}

async function main() {
  logger.info('Starting Discord content scraper');
  
  if (!config.discord.email || !config.discord.password) {
    logger.error('Discord credentials not configured. Please update the .env file.');
    process.exit(1);
  }
  
  if (config.discord.serverIds.length === 0 || config.discord.channelIds.length === 0) {
    logger.error('Discord server IDs or channel IDs not configured. Please update the .env file.');
    process.exit(1);
  }
  
  const scraper = new DiscordScraper();
  
  try {
    await scraper.initialize();
    
    await scraper.login();
    
    for (let i = 0; i < Math.min(config.discord.serverIds.length, config.discord.channelIds.length); i++) {
      const serverId = config.discord.serverIds[i];
      const channelId = config.discord.channelIds[i];
      
      logger.info(`Processing server ${serverId}, channel ${channelId}`);
      
      await scraper.navigateToChannel(serverId, channelId);
      
      const messages = await scraper.scrapeMessages();
      
      const filename = `discord_${serverId}_${channelId}_${Date.now()}.${config.output.fileFormat}`;
      await scraper.saveMessages(messages, filename);
    }
    
    logger.info('Discord content scraping completed successfully');
  } catch (error) {
    logger.error('Error during Discord content scraping', error as Error);
  } finally {
    await scraper.close();
  }
}

main().catch(error => {
  logger.error('Unhandled error in main function', error as Error);
  process.exit(1);
});
