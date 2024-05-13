import { SyncedCache } from "@bouncer/cache";
import { Controller } from "@bouncer/controller";
import { WorkerContext } from "@bouncer/data";
import { type BrowseEvent, BrowserEvents, type IControllerEventEmitter, type SystemEvent } from "@bouncer/events";
import type { FrameMessage } from "@bouncer/message";

export class Worker<TEvents extends IControllerEventEmitter> {
  private readonly controller: SyncedCache<Controller>;
  
  constructor(
    readonly events: TEvents,
    private readonly context: WorkerContext,
  ) {
    this.controller = new SyncedCache(this.initializeController);
  }

  static browser(): Worker<IControllerEventEmitter> {
    return new Worker(
      BrowserEvents.browser(),
      WorkerContext.browser(),
    );
  }

  private initializeController = async (): Promise<Controller> => {
    const { logs, guards, activeTabs, guardPostings, configuration, browseActivity, } = await this.context.fetch();
    logs.logger("Worker").info("initializing controller");
    return Controller.browser(configuration, guards, guardPostings, activeTabs, browseActivity, logs);
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

  private onSystem = async (event: SystemEvent) => {
    const controller = await this.controller.value();
    controller.handleSystem(event);
    this.context.commit();
  }

  start = () => {
    this.events.onMessage.addListener(this.onMessage);
    this.events.onBrowse.addListener(this.onBrowse);
    this.events.onSystem.addListener(this.onSystem);
    this.events.start();
  }

  stop = () => {
    this.events.stop();
    this.events.onMessage.removeListener(this.onMessage);
    this.events.onBrowse.removeListener(this.onBrowse);
    this.events.onSystem.removeListener(this.onSystem);
  }
}
