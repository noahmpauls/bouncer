import { SyncedCache } from "@bouncer/cache";
import { Controller } from "@bouncer/controller";
import { type IBouncerContext, LogsContext, BouncerContext } from "@bouncer/data";
import { BrowserEvents, type BrowseEvent, type IBrowserEventHandler, type IControllerEventEmitter } from "@bouncer/events";
import { BrowserControllerMessenger, type FrameMessage, type IControllerMessenger } from "@bouncer/message";

export class Worker<TEvents extends IControllerEventEmitter> {
  private readonly controller: SyncedCache<Controller>;
  
  constructor(
    readonly events: TEvents,
    private readonly bouncerContext: IBouncerContext,
    private readonly logsContext: LogsContext,
    private readonly messenger: IControllerMessenger,
  ) {
    this.controller = new SyncedCache(this.initializeController);
  }

  static fromBrowser(): Worker<IControllerEventEmitter & IBrowserEventHandler> {
    const logsContext = LogsContext.browser();
    return new Worker(
      new BrowserEvents(),
      BouncerContext.browser(logsContext.fetch()),
      logsContext,
      BrowserControllerMessenger,
    );
  }

  private initializeController = async (): Promise<Controller> => {
    const logs = this.logsContext.fetch();
    logs.logger("Worker").info("initializing controller");
    return new Controller(this.bouncerContext, this.messenger, logs);
  }

  private onMessage = async (message: FrameMessage) => {
    const controller = await this.controller.value();
    controller.handleMessage(message);
    this.logsContext.commit();
  }

  private onBrowse = async (event: BrowseEvent) => {
    const controller = await this.controller.value();
    controller.handleBrowse(event);
    this.logsContext.commit();    
  }

  start = () => {
    this.events.onMessage.addListener(this.onMessage);
    this.events.onBrowse.addListener(this.onBrowse);
  }

  stop = () => {
    this.events.onMessage.removeListener(this.onMessage);
    this.events.onBrowse.removeListener(this.onBrowse);
  }
}
