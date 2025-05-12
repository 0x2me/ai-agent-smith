enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;
  private context: string;

  constructor(context: string, level: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.level = level;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.context}] ${message}`;
  }

  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message));
    }
  }

  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message));
    }
  }

  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message));
    }
  }

  error(message: string, error?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message));
      if (error) {
        console.error(error.stack || error.message);
      }
    }
  }
}

export { Logger, LogLevel };
