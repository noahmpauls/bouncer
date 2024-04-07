import { MemoryLogs, type ILogs, type ILogsWriter, LogsStorage } from "@bouncer/logs";
import type { IContext } from "./types";
import type { IConfiguration } from "@bouncer/config";

export class LogsContext implements IContext<ILogs> {
  // TODO: could we use an interface instead of MemoryLogs directly?
  constructor(
    private readonly logs: MemoryLogs,
    private readonly logsStorage: ILogsWriter,
  ) { }

  static browser = (config: IConfiguration): LogsContext => {
    return new LogsContext(
      MemoryLogs.browser(),
      LogsStorage.browser(config),
    )
  }

  fetch = async (): Promise<ILogs> => {
    return this.logs;
  }

  commit = async () => {
    await this.logsStorage.write(this.logs.flush());
  }
}