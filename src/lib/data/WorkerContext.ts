import type { ActiveTabs, GuardPostings } from "@bouncer/controller";
import type { IBouncerContext, IContext } from "./types";
import type { IGuard } from "@bouncer/guard";
import type { ILogs } from "@bouncer/logs";
import { LogsContext } from "./LogsContext";
import { SyncedCache } from "@bouncer/cache";
import { BouncerContext } from "./BouncerContext";
import { ConfigContext } from "./ConfigContext";
import type { IConfiguration } from "@bouncer/config";

type WorkerContextObject = {
  guards: IGuard[],
  activeTabs: ActiveTabs,
  guardPostings: GuardPostings,
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
    const { logsContext, bouncerContext } = await this.cache.value();
    const logs = await logsContext.fetch();
    const bouncer = await bouncerContext.fetch();
    return {
      ...bouncer,
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