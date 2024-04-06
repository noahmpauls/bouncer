import { MemoryLogs, type ILogs, type ILogsWriter, LogsStorage } from "@bouncer/logs";
import type { IContext } from "./types";

export class LogsContext implements IContext<ILogs> {
  // TODO: could we use an interface instead of MemoryLogs directly?
  constructor(
    private readonly logs: MemoryLogs,
    private readonly logsStorage: ILogsWriter,
  ) { }

  static browser = (): LogsContext => {
    return new LogsContext(
      MemoryLogs.browser(),
      LogsStorage.browser(),
    )
  }

  // TODO: we can't implement with IContext, since this is synchronous...
  fetch = async (): Promise<ILogs> => {
    return this.logs;
  }

  commit = async () => {
    await this.logsStorage.write(this.logs.flush());
  }
}