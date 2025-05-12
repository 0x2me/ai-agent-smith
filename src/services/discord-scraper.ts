import { Builder, By, until, WebDriver, WebElement } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import fs from 'fs';
import path from 'path';
import config from '../config/config';
import { Logger } from '../utils/logger';

interface DiscordMessage {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  attachments: string[];
}

class DiscordScraper {
  private driver: WebDriver | null = null;
  private logger: Logger;
  private isLoggedIn: boolean = false;

  constructor() {
    this.logger = new Logger('DiscordScraper');
  }

  /**
   * Initialize the WebDriver with Chrome options
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Discord scraper');
    
    try {
      const chromeOptions = new Options();
      
      if (config.selenium.headless) {
        chromeOptions.addArguments('--headless=new');
      }
      
      chromeOptions.addArguments(
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-notifications',
        '--window-size=1920,1080'
      );

      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

      await this.driver.manage().setTimeouts({ implicit: config.selenium.implicitWaitMs });
      
      this.logger.info('WebDriver initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize WebDriver', error as Error);
      throw error;
    }
  }

  /**
   * Login to Discord with credentials from config
   */
  async login(): Promise<void> {
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }

    if (!config.discord.email || !config.discord.password) {
      throw new Error('Discord credentials not provided in configuration');
    }

    try {
      this.logger.info('Logging into Discord');
      
      await this.driver.get('https://discord.com/login');
      
      await this.driver.wait(until.elementLocated(By.css('input[name="email"]')), 10000);
      
      await this.driver.findElement(By.css('input[name="email"]')).sendKeys(config.discord.email);
      await this.driver.findElement(By.css('input[name="password"]')).sendKeys(config.discord.password);
      
      await this.driver.findElement(By.css('button[type="submit"]')).click();
      
      await this.driver.wait(until.elementLocated(By.css('div[class*="sidebar"]')), 30000);
      
      this.isLoggedIn = true;
      this.logger.info('Successfully logged into Discord');
    } catch (error) {
      this.logger.error('Failed to login to Discord', error as Error);
      throw error;
    }
  }

  /**
   * Navigate to a specific Discord channel
   */
  async navigateToChannel(serverId: string, channelId: string): Promise<void> {
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }

    if (!this.isLoggedIn) {
      throw new Error('Not logged into Discord');
    }

    try {
      this.logger.info(`Navigating to channel: ${channelId} in server: ${serverId}`);
      
      await this.driver.get(`https://discord.com/channels/${serverId}/${channelId}`);
      
      await this.driver.wait(until.elementLocated(By.css('div[id^="chat-messages-"]')), 10000);
      
      this.logger.info(`Successfully navigated to channel: ${channelId}`);
    } catch (error) {
      this.logger.error(`Failed to navigate to channel: ${channelId}`, error as Error);
      throw error;
    }
  }

  /**
   * Scrape messages from the current channel
   */
  async scrapeMessages(limit: number = 100): Promise<DiscordMessage[]> {
    if (!this.driver) {
      throw new Error('WebDriver not initialized');
    }

    if (!this.isLoggedIn) {
      throw new Error('Not logged into Discord');
    }

    try {
      this.logger.info(`Scraping up to ${limit} messages from current channel`);
      
      const messages: DiscordMessage[] = [];
      let lastMessageCount = 0;
      let scrollAttempts = 0;
      const maxScrollAttempts = 10;
      
      while (messages.length < limit && scrollAttempts < maxScrollAttempts) {
        const messageElements = await this.driver.findElements(By.css('li[id^="chat-messages-"]'));
        
        for (let i = lastMessageCount; i < messageElements.length && messages.length < limit; i++) {
          const messageElement = messageElements[i];
          
          try {
            const message = await this.parseMessageElement(messageElement);
            messages.push(message);
          } catch (error) {
            this.logger.warn(`Failed to parse message at index ${i}: ${(error as Error).message}`);
          }
        }
        
        lastMessageCount = messageElements.length;
        
        if (messages.length < limit) {
          await this.driver.executeScript('arguments[0].scrollIntoView(true)', messageElements[0]);
          
          await this.driver.sleep(1000);
          
          const newMessageElements = await this.driver.findElements(By.css('li[id^="chat-messages-"]'));
          if (newMessageElements.length === lastMessageCount) {
            scrollAttempts++;
          } else {
            scrollAttempts = 0;
          }
        }
      }
      
      this.logger.info(`Successfully scraped ${messages.length} messages`);
      return messages;
    } catch (error) {
      this.logger.error('Failed to scrape messages', error as Error);
      throw error;
    }
  }

  /**
   * Parse a message element into a structured DiscordMessage object
   */
  private async parseMessageElement(element: WebElement): Promise<DiscordMessage> {
    try {
      const id = await element.getAttribute('id');
      const messageId = id.replace('chat-messages-', '');
      
      const authorElement = await element.findElement(By.css('[class*="username"]'));
      const author = await authorElement.getText();
      
      let content = '';
      try {
        const contentElement = await element.findElement(By.css('[id^="message-content-"]'));
        content = await contentElement.getText();
      } catch (error) {
      }
      
      const timestampElement = await element.findElement(By.css('[class*="timestamp"]'));
      const timestamp = await timestampElement.getText();
      
      const attachments: string[] = [];
      try {
        const attachmentElements = await element.findElements(By.css('[class*="attachment"]'));
        for (const attachmentElement of attachmentElements) {
          try {
            const imageElement = await attachmentElement.findElement(By.css('img'));
            const imageUrl = await imageElement.getAttribute('src');
            attachments.push(imageUrl);
          } catch {
            try {
              const linkElement = await attachmentElement.findElement(By.css('a'));
              const fileUrl = await linkElement.getAttribute('href');
              attachments.push(fileUrl);
            } catch {
            }
          }
        }
      } catch {
      }
      
      return {
        id: messageId,
        author,
        content,
        timestamp,
        attachments
      };
    } catch (error) {
      this.logger.error('Failed to parse message element', error as Error);
      throw error;
    }
  }

  /**
   * Save scraped messages to a file
   */
  async saveMessages(messages: DiscordMessage[], filename: string): Promise<string> {
    try {
      if (!fs.existsSync(config.output.directory)) {
        fs.mkdirSync(config.output.directory, { recursive: true });
      }
      
      const outputPath = path.join(config.output.directory, filename);
      
      switch (config.output.fileFormat) {
        case 'json':
          fs.writeFileSync(outputPath, JSON.stringify(messages, null, 2));
          break;
        case 'csv':
          const csvHeader = 'id,author,timestamp,content,attachments\n';
          const csvRows = messages.map(msg => 
            `"${msg.id}","${msg.author}","${msg.timestamp}","${msg.content.replace(/"/g, '""')}","${msg.attachments.join(', ')}"`
          ).join('\n');
          fs.writeFileSync(outputPath, csvHeader + csvRows);
          break;
        case 'txt':
          const textContent = messages.map(msg => 
            `[${msg.timestamp}] ${msg.author}: ${msg.content}\n${msg.attachments.length > 0 ? 'Attachments: ' + msg.attachments.join(', ') + '\n' : ''}\n`
          ).join('---\n');
          fs.writeFileSync(outputPath, textContent);
          break;
      }
      
      this.logger.info(`Saved ${messages.length} messages to ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error('Failed to save messages', error as Error);
      throw error;
    }
  }

  /**
   * Close the WebDriver and clean up resources
   */
  async close(): Promise<void> {
    if (this.driver) {
      try {
        this.logger.info('Closing WebDriver');
        await this.driver.quit();
        this.driver = null;
        this.isLoggedIn = false;
        this.logger.info('WebDriver closed successfully');
      } catch (error) {
        this.logger.error('Failed to close WebDriver', error as Error);
        throw error;
      }
    }
  }
}

export { DiscordScraper, DiscordMessage };
