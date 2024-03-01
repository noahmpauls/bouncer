import browser from "webextension-polyfill";
import type { ClientMessage, ControllerMessage, IClientMessenger, IControllerMessenger } from "./types";

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

export const BrowserControllerMessenger: IControllerMessenger = {
  send: (tabId, frameId, message) => {
    browser.tabs.sendMessage(tabId, message, { frameId })
      .then(() => {
        console.log(`successfully messaged ${tabId}-${frameId}`);
      })
      .catch(reason => {
        console.error(`could not send message to ${tabId}-${frameId}: ${reason}`)
      });
  },
}
