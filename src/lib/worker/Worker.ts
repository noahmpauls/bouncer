import { SyncedCache } from "@bouncer/cache";
import { Controller } from "@bouncer/controller";
import { WorkerContext } from "@bouncer/data";
import { type BrowseEvent, BrowserEvents, type IBrowserEventHandler, type IControllerEventEmitter } from "@bouncer/events";
import type { FrameMessage } from "@bouncer/message";

export class Worker<TEvents extends IControllerEventEmitter> {
  private readonly controller: SyncedCache<Controller>;
  
  constructor(
    readonly events: TEvents,
    private readonly context: WorkerContext,
  ) {
    this.controller = new SyncedCache(this.initializeController);
  }

  static browser(): Worker<IControllerEventEmitter & IBrowserEventHandler> {
    return new Worker(
      BrowserEvents.browser(),
      WorkerContext.browser(),
    );
  }

  private initializeController = async (): Promise<Controller> => {
    const { logs, guards, activeTabs, guardPostings, configuration } = await this.context.fetch();
    logs.logger("Worker").info("initializing controller");
    return Controller.browser(configuration, guards, guardPostings, activeTabs, logs);
  }

  private onMessage = async (message: FrameMessage) => {
    const controller = await this.controller.value();
    controller.handleMessage(message);
    this.context.commit();
  }

  private onBrowse = async (event: BrowseEvent) => {
    const controller = await this.controller.value();
    controller.handleBrowse(event);
    this.context.commit();    
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
