/**
 * Level of a log.
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
}

/**
 * A single log entry.
 */
export type Log = {
  timestamp: number,
  level: LogLevel,
  category?: string,
  message: string,
}

/**
 * Represents a creator of entries in a log.
 */
export interface ILogger {
  debug(message: string): void;
  info(message: string): void;
  warning(message: string): void;
  error(message: string): void;
}

/**
 * Represents a set of logs.
 */
export interface ILogs {
  /**
   * Create a logger for these logs.
   * 
   * @param category category of the logger
   * @returns logger
   */
  logger(category?: string): ILogger;
}

export interface ILogsReader {
  logs(): Promise<Log[]>;
  subscribe(callback: (logs: Log[]) => void): void;
  unsubscribe(callback: (logs: Log[]) => void): void;
}

export interface ILogsWriter {
  write(logs: Log[]): Promise<void>;
}
