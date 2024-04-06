import { LogLevel, type ILogger, type Log, type ILogs } from "./types";
import { BrowserClock, type IClock } from "@bouncer/time";

export class MemoryLogs implements ILogs {
  private readonly logs: ArrayLog = new ArrayLog();

  constructor(
    private readonly clock: IClock,
  ) { }

  static browser = (): MemoryLogs =>
    new MemoryLogs(BrowserClock);
  
  logger = (category?: string): ILogger => {
    return new MemoryLogger(this.clock, this.logs, category)
  }
  
  flush = (): Log[] => this.logs.flush();
}

class MemoryLogger implements ILogger {

  constructor(
    private readonly clock: IClock,
    private readonly logs: ArrayLog,
    private readonly category?: string,
  ) { }

  debug = (message: string): void => {
    this.log(LogLevel.DEBUG, message);
  }

  info = (message: string): void => {
    this.log(LogLevel.INFO, message);
  }

  warning = (message: string): void => {
    this.log(LogLevel.WARNING, message);
  }

  error = (message: string): void => {
    this.log(LogLevel.ERROR, message);
  }

  private log = (level: LogLevel, message: string) => {
    const timestamp = this.clock.time();
    const log: Log = { timestamp: timestamp.getTime(), level, message };
    if (this.category !== undefined) {
      log.category = this.category;
    }
    this.logs.push(log);
  }
}

class ArrayLog {
  private readonly logs: Log[] = [];

  constructor() { }

  push = (log: Log) => this.logs.push(log);

  flush = (): Log[] => {
    const result = this.logs.splice(0);
    this.logs.length = 0;
    return result;
  }
}
