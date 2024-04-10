import { browser } from "@bouncer/browser";
import type { ClientMessage, ControllerMessage, IClientMessenger, IControllerMessenger } from "./types";
import type { ILogger, ILogs } from "@bouncer/logs";

export const BrowserClientMessenger: IClientMessenger = {
  send: (message: ClientMessage) => {
    browser.runtime.sendMessage(message);
  },

  addReceiver: (receiver: (message: ControllerMessage) => void) => {
    browser.runtime.onMessage.addListener(receiver);
  },

  removeReceiver: (receiver: (message: ControllerMessage) => void) => {
    browser.runtime.onMessage.removeListener(receiver);
  }
}

export class BrowserControllerMessenger implements IControllerMessenger {
  private readonly logger: ILogger;

  constructor(logs: ILogs) {
    this.logger = logs.logger("ControllerMessenger");
  }

  send = (tabId: number, frameId: number, message: ControllerMessage) => {
    browser.tabs.sendMessage(tabId, message, { frameId })
      .then(() => {
        this.logger.debug(`successfully messaged ${tabId}-${frameId}`);
      })
      .catch(reason => {
        this.logger.warning(`failed to message ${tabId}-${frameId}: ${reason}`)
      });
  }
}
