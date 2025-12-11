/**
 * Development logging utility for debugging
 * Logs are stored in memory and can be exported
 * This file is excluded from git commits per C-10 guidelines
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

const MAX_LOG_ENTRIES = 1000;
const logs: LogEntry[] = [];

function formatTimestamp(): string {
  return new Date().toISOString();
}

function addLog(level: LogLevel, message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: formatTimestamp(),
    level,
    message,
    data,
  };

  logs.push(entry);

  // Rotate logs if exceeding max
  if (logs.length > MAX_LOG_ENTRIES) {
    logs.shift();
  }

  // Also log to console in development
  if (import.meta.env.DEV) {
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`, data ?? '');
  }
}

export const devLog = {
  debug: (message: string, data?: unknown) => addLog('debug', message, data),
  info: (message: string, data?: unknown) => addLog('info', message, data),
  warn: (message: string, data?: unknown) => addLog('warn', message, data),
  error: (message: string, data?: unknown) => addLog('error', message, data),

  /**
   * Get all logs
   */
  getLogs: (): LogEntry[] => [...logs],

  /**
   * Get logs as formatted string for export
   */
  exportLogs: (): string => {
    return logs
      .map((entry) => {
        const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
        return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${dataStr}`;
      })
      .join('\n');
  },

  /**
   * Clear all logs
   */
  clear: (): void => {
    logs.length = 0;
  },

  /**
   * Log function inputs and outputs for debugging
   */
  trace: <T>(fnName: string, inputs: unknown, fn: () => T): T => {
    devLog.debug(`${fnName} - inputs`, inputs);
    try {
      const result = fn();
      devLog.debug(`${fnName} - output`, result);
      return result;
    } catch (error) {
      devLog.error(`${fnName} - error`, error);
      throw error;
    }
  },
};

// Make available globally in dev for debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { devLog: typeof devLog }).devLog = devLog;
}
