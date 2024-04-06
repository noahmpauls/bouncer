import { SyncedCache } from "@bouncer/cache";
import { Controller } from "@bouncer/controller";
import { BouncerContext } from "@bouncer/data";
import { BrowserEvents, type IBrowserEventHandler, type IControllerEventEmitter } from "@bouncer/events";
import { BrowserControllerMessenger, type IControllerMessenger } from "@bouncer/message";

export class Worker<TEvents extends IControllerEventEmitter> {
  private readonly controller: Controller;

  constructor(
    readonly events: TEvents,
    context: BouncerContext,
    messenger: IControllerMessenger,
  ) {
    this.controller = new Controller(context, messenger);
  }

  static fromBrowser(): Worker<IControllerEventEmitter & IBrowserEventHandler> {
    return new Worker(
      new BrowserEvents(),
      BouncerContext.browser(),
      BrowserControllerMessenger,
    );
  }

  start = () => {
    this.events.onMessage.addListener(this.controller.handleMessage);
    this.events.onBrowse.addListener(this.controller.handleBrowse);
  }

  stop = () => {
    this.events.onMessage.removeListener(this.controller.handleMessage);
    this.events.onBrowse.removeListener(this.controller.handleBrowse);
  }
}
