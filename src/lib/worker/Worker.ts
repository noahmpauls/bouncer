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
    private readonly initializeController: (context: WorkerContext) => Promise<Controller>,
  ) {
    this.controller = new SyncedCache(this.createController);
  }

  static browser(): Worker<IControllerEventEmitter> {
    return new Worker(
      BrowserEvents.browser(),
      WorkerContext.browser(),
      async (context) => {
        const { logs, guards, activeTabs, guardPostings, configuration, browseActivity, } = await context.fetch();
        return Controller.browser(configuration, guards, guardPostings, activeTabs, browseActivity, logs);
      }
    );
  }

  private createController = async (): Promise<Controller> =>
    this.initializeController(this.context);

  private onMessage = async (message: FrameMessage) => {
    const controller = await this.controller.value();
    controller.handleMessage(message);
    await this.context.commit();
  }

  private onBrowse = async (event: BrowseEvent) => {
    const controller = await this.controller.value();
    controller.handleBrowse(event);
    await this.context.commit();    
  }

  private onSystem = async (event: SystemEvent) => {
    const controller = await this.controller.value();
    controller.handleSystem(event);
    await this.context.commit();
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

  clear = async () => {
    await this.context.clear();
    await this.controller.clear();
  }
}
