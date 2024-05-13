import { SyncedCache } from "@bouncer/cache";
import type { IConfiguration } from "@bouncer/config";
import type { ILogs } from "@bouncer/logs";
import { BouncerContext } from "./BouncerContext";
import { ConfigContext } from "./ConfigContext";
import { LogsContext } from "./LogsContext";
import type { BouncerContextObject, IBouncerContext, IContext } from "./types";

type WorkerContextObject = BouncerContextObject & {
  configuration: IConfiguration,
  logs: ILogs,
}

type ContextCache = {
  configContext: ConfigContext,
  logsContext: LogsContext,
  bouncerContext: IBouncerContext,
}

export class WorkerContext implements IContext<WorkerContextObject> {
  private readonly cache: SyncedCache<ContextCache>;
  
  constructor(
    private readonly initializeConfigContext: () => ConfigContext,
    private readonly initializeLogsContext: (config: IConfiguration) => LogsContext,
    private readonly initializeBouncerContext: (logs: ILogs) => IBouncerContext,
  ) {
    this.cache = new SyncedCache(async () => {
      const configContext = this.initializeConfigContext();
      const config = await configContext.fetch();
      const logsContext = this.initializeLogsContext(config);
      const logs = await logsContext.fetch();
      const bouncerContext = this.initializeBouncerContext(logs);
      return {
        configContext,
        logsContext,
        bouncerContext,
      }
    });
  }

  static browser = (): WorkerContext => {
    return new WorkerContext(
      () => ConfigContext.browser(),
      (config) => LogsContext.browser(config),
      logs => BouncerContext.browser(logs),
    )
  }

  fetch = async (): Promise<WorkerContextObject> => {
    const { configContext, logsContext, bouncerContext } = await this.cache.value();
    const configuration = await configContext.fetch();
    const logs = await logsContext.fetch();
    const bouncer = await bouncerContext.fetch();
    return {
      ...bouncer,
      configuration,
      logs,
    }
  }

  commit = async () => {
    const { logsContext, bouncerContext, configContext } = await this.cache.value();
    await bouncerContext.commit();
    await logsContext.commit();
    await configContext.commit();
  }
}