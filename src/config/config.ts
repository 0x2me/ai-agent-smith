import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

interface Config {
  discord: {
    email: string;
    password: string;
    serverIds: string[];
    channelIds: string[];
  };
  selenium: {
    headless: boolean;
    implicitWaitMs: number;
  };
  output: {
    directory: string;
    fileFormat: 'json' | 'csv' | 'txt';
  };
}

const config: Config = {
  discord: {
    email: process.env.DISCORD_EMAIL || '',
    password: process.env.DISCORD_PASSWORD || '',
    serverIds: process.env.DISCORD_SERVER_IDS ? process.env.DISCORD_SERVER_IDS.split(',') : [],
    channelIds: process.env.DISCORD_CHANNEL_IDS ? process.env.DISCORD_CHANNEL_IDS.split(',') : [],
  },
  selenium: {
    headless: process.env.SELENIUM_HEADLESS !== 'false',
    implicitWaitMs: parseInt(process.env.SELENIUM_IMPLICIT_WAIT_MS || '10000', 10),
  },
  output: {
    directory: process.env.OUTPUT_DIRECTORY || path.join(process.cwd(), 'data'),
    fileFormat: (process.env.OUTPUT_FILE_FORMAT as 'json' | 'csv' | 'txt') || 'json',
  },
};

export default config;
