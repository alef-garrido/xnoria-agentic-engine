// Client-side logger that safely falls back to console
// Designed for use in React components ("use client")

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug(msg: string, data?: any): void;
  info(msg: string, data?: any): void;
  warn(msg: string, data?: any): void;
  error(msg: string, data?: any): void;
}

class ConsoleLogger implements Logger {
  private shouldLog(level: LogLevel): boolean {
    if (level === 'debug' && process.env.NODE_ENV === 'production') {
      return false;
    }
    return true;
  }

  debug(msg: string, data?: any): void {
    if (!this.shouldLog('debug')) return;
    console.debug(`[DEBUG] ${msg}`, data || '');
  }

  info(msg: string, data?: any): void {
    if (!this.shouldLog('info')) return;
    console.log(`[INFO] ${msg}`, data || '');
  }

  warn(msg: string, data?: any): void {
    if (!this.shouldLog('warn')) return;
    console.warn(`[WARN] ${msg}`, data || '');
  }

  error(msg: string, data?: any): void {
    console.error(`[ERROR] ${msg}`, data || '');
  }
}

// Singleton instance
export const clientLogger: Logger = new ConsoleLogger();
export default clientLogger;