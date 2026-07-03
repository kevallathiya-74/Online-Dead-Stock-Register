import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
}

class FrontendLogger {
  private queue: LogPayload[] = [];
  private isProcessing = false;

  private async sendLog(payload: LogPayload) {
    if (payload.meta?.isLogIngestion) return;

    if (process.env.NODE_ENV === 'development') {
      const colors = {
        info: 'color: #0066cc',
        warn: 'color: #e6a23c',
        error: 'color: #f56c6c',
        debug: 'color: #909399',
      };
      console.log(
        `%c[Frontend ${payload.level.toUpperCase()}] ${payload.message}`,
        colors[payload.level],
        payload.meta || ''
      );
      return;
    }

    this.queue.push(payload);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    // Use a clean direct Axios instance to avoid circular logic or interceptor hooks
    const logClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 5000,
    });

    const token = localStorage.getItem('token');
    if (token) {
      logClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    while (this.queue.length > 0) {
      const current = this.queue[0];
      try {
        await logClient.post('/logs', {
          level: current.level,
          message: current.message,
          meta: {
            ...current.meta,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            isLogIngestion: true,
          },
        });
        this.queue.shift(); // Remove from queue if successful
      } catch (err) {
        // Fallback to local console in case of server ingestion issues
        console.warn('Failed to send log to server:', err);
        break; // Stop processing and retry later
      }
    }
    this.isProcessing = false;
  }

  public info(message: string, meta?: Record<string, any>) {
    this.sendLog({ level: 'info', message, meta });
  }

  public warn(message: string, meta?: Record<string, any>) {
    this.sendLog({ level: 'warn', message, meta });
  }

  public error(message: string, error?: unknown, meta?: Record<string, any>) {
    const errorMeta: Record<string, any> = { ...meta };
    if (error instanceof Error) {
      errorMeta.errorName = error.name;
      errorMeta.errorMessage = error.message;
      errorMeta.errorStack = error.stack;
    } else if (error) {
      errorMeta.rawError = error;
    }
    this.sendLog({ level: 'error', message, meta: errorMeta });
  }

  public debug(message: string, meta?: Record<string, any>) {
    this.sendLog({ level: 'debug', message, meta });
  }
}

export const logger = new FrontendLogger();
export default logger;
