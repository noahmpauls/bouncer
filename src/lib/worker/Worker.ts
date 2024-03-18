import { SyncedCache } from "@bouncer/cache";
import { Controller } from "@bouncer/controller";
import { BouncerContext } from "@bouncer/data/BouncerContext";
import { BrowserEvents, type IBrowserEventHandler, type IControllerEventEmitter } from "@bouncer/events";
import { BrowserControllerMessenger, type IControllerMessenger } from "@bouncer/message";

export class Worker<TEvents extends IControllerEventEmitter> {
  private readonly controllerCache: SyncedCache<Controller>;

  constructor(
    private readonly context: BouncerContext,
    readonly events: TEvents,
    messenger: IControllerMessenger
  ) {
    this.controllerCache = new SyncedCache(async () => {
      return this.context.fetch()
        .then(data => new Controller(data.guards, data.guardPostings, data.activeTabs, messenger))
    });
  }

  static fromBrowser(): Worker<IControllerEventEmitter & IBrowserEventHandler> {
    return new Worker(
      BouncerContext.browser(),
      new BrowserEvents(),
      BrowserControllerMessenger,
    );
  }

  start = () => {
    this.events.onMessage.addListener(this.saveOnComplete(async (event) => {
      this.controllerCache.value()
        .then(c => c.handleMessage(event));
    }));
    this.events.onBrowse.addListener(this.saveOnComplete(async (event) => {
      this.controllerCache.value()
        .then(c => c.handleBrowse(event));
    }));
  }

  private saveOnComplete = (func: (...args: any[]) => Promise<void>) => {
    return async (...args: any[]) => {
      await func(...args)
      await this.context.commit();
      this.logTimestamp(new Date(), "data saved.");
    }
  }

  private logTimestamp = (time: Date, message: string) => console.log(`${time.getTime()} ${ message }`)
}