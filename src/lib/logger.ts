export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  error?: any;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private isClient: boolean;
  private logs: LogEntry[] = [];

  private constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, category, message, data, error, stack } = entry;
    let formatted = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;
    
    if (data) {
      formatted += `\nData: ${JSON.stringify(data, null, 2)}`;
    }
    
    if (error) {
      formatted += `\nError: ${error.message || error}`;
      if (stack) {
        formatted += `\nStack: ${stack}`;
      }
    }
    
    return formatted;
  }

  private writeToFile(entry: LogEntry) {
    // File writing is handled by the API route
    // This method is kept for compatibility
  }

  private log(level: LogLevel, category: string, message: string, data?: any, error?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error: error ? { message: error.message, code: error.code, status: error.status } : undefined,
      stack: error?.stack,
    };

    // Store in memory for client access
    this.logs.push(entry);
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500); // Keep last 500 entries
    }

    // Console output with styling
    const styles = {
      info: 'color: #3B82F6; font-weight: normal;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
    };

    const prefix = `[${entry.timestamp.split('T')[1].split('.')[0]}] [${category}]`;
    
    if (this.isClient) {
      console.log(`%c${prefix} ${message}`, styles[level]);
      if (data) console.log('Data:', data);
      if (error) console.error('Error:', error);
    } else {
      const colorCodes = {
        info: '\x1b[36m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
      };
      const reset = '\x1b[0m';
      console.log(`${colorCodes[level]}${prefix}${reset} ${message}`);
      if (data) console.log('Data:', data);
      if (error) console.error('Error:', error);
    }

    // Server logging removed - all logs go to console only
  }


  info(category: string, message: string, data?: any) {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, error?: any, data?: any) {
    this.log('error', category, message, data, error);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  // API-specific logging helpers
  apiRequest(endpoint: string, method: string, data?: any) {
    this.info('API_REQUEST', `${method} ${endpoint}`, data);
  }

  apiResponse(endpoint: string, status: number, data?: any) {
    const level = status >= 400 ? 'error' : 'info';
    this.log(level, 'API_RESPONSE', `${endpoint} - Status: ${status}`, data);
  }

  apiError(endpoint: string, error: any) {
    this.error('API_ERROR', `Failed request to ${endpoint}`, error);
  }

  // Auth-specific logging
  authCheck(message: string, data?: any) {
    this.info('AUTH', message, data);
  }

  authError(message: string, error?: any) {
    this.error('AUTH_ERROR', message, error);
  }

  // Navigation logging
  navigation(route: string, params?: any) {
    this.info('NAVIGATION', `Navigating to ${route}`, params);
  }

  // Store operation logging
  storeAction(store: string, action: string, data?: any) {
    this.info('STORE', `${store}.${action}`, data);
  }
}

export const logger = Logger.getInstance();