import type { IConfiguration } from "@bouncer/config";
import { type ILogs, type ILogsWriter, LogsStorageWriter, MemoryLogs } from "@bouncer/logs";
import type { IContext } from "./types";

export class LogsContext implements IContext<ILogs> {
  // TODO: could we use an interface instead of MemoryLogs directly?
  constructor(
    private readonly logs: MemoryLogs,
    private readonly logsStorage: ILogsWriter,
  ) { }

  static browser = (config: IConfiguration): LogsContext => {
    return new LogsContext(
      MemoryLogs.browser(),
      LogsStorageWriter.browser(config),
    )
  }

  fetch = async (): Promise<ILogs> => {
    return this.logs;
  }

  commit = async () => {
    await this.logsStorage.write(this.logs.flush());
  }

  clear = async () => {
    const _ = this.logs.flush();
  }
}