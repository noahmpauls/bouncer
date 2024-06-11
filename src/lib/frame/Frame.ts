import { BrowserClientMessenger, ClientMessageType, type ControllerMessage, ControllerMessageType, FrameStatus, type IClientMessenger } from "@bouncer/message";
import { BrowserBlocker } from "./BrowerBlocker";
import type { IBlocker } from "./types";

export class Frame {
  // checker for viewtime-based blocks
  private viewtimeChecker: NodeJS.Timeout | null = null;
  // checker for window-based blocks
  private windowChecker: NodeJS.Timeout | null = null;

  private readonly messenger: IClientMessenger;
  private readonly blocker: IBlocker;

  constructor(messenger: IClientMessenger, blocker: IBlocker) {
    this.messenger = messenger;
    this.blocker = blocker;
  }

  static browser(): Frame {
    return new Frame(BrowserClientMessenger, BrowserBlocker);
  }

  start = () => {
    this.messenger.addReceiver(this.handleMessage);
    this.requestStatus(new Date());
  }

  handleMessage = (message: ControllerMessage) => {
    if (message.type !== ControllerMessageType.STATUS) {
      return;
    }
    const time = new Date();
    console.log(`${time.getTime()} frame: received ${message?.status} for ${window.location.hostname}`);
    switch (message.status) {
      case FrameStatus.BLOCKED:
        this.blocker.block();
        break;
      case FrameStatus.ALLOWED:
        if (message.viewtimeCheck !== undefined) {
          const viewtimeCheck = new Date(message.viewtimeCheck);
          console.log(`viewtime check in ${(viewtimeCheck.getTime() - Date.now()) / 1000} seconds`)
          this.resetViewtimeChecker(viewtimeCheck);
        }
        if (message.windowCheck !== undefined) {
          const windowCheck = new Date(message.windowCheck);
          console.log(`window check in ${(windowCheck.getTime() - Date.now()) / 1000} seconds`)
          this.resetWindowChecker(windowCheck);
        }
        break;
      case FrameStatus.UNTRACKED:
        this.clearViewtimeChecker();
        this.clearWindowChecker();
        this.messenger.removeReceiver(this.handleMessage);
        break;
    }
  }

  private requestStatus = (time: Date) => {
    this.messenger.send({
      type: ClientMessageType.STATUS,
      time: time.toISOString(),
    });
  }
  
  /**
   * Set the viewtime checker to send a check to the service worker at the
   * given time.
   * 
   * @param checkTime time at which checker should fire
   */
  private resetViewtimeChecker = (checkTime: Date) => {
    this.clearViewtimeChecker();
    const msToCheck = checkTime.getTime() - Date.now();
    this.viewtimeChecker = setTimeout(async () => {
      const currentTime = new Date();
      this.requestStatus(currentTime);
    }, msToCheck);
  }
  
  /**
   * Clear the viewtime checker if it is currently set.
   */
  private clearViewtimeChecker = () => {
    if (this.viewtimeChecker !== null) {
      clearTimeout(this.viewtimeChecker);
      this.viewtimeChecker = null;
    }
  }
  
  /**
   * Set the window checker to send a check to the service worker at the given
   * time.
   *
   * @param checkTime time at which checker should fire
   */
  private resetWindowChecker = (checkTime: Date) => {
    this.clearWindowChecker();
    const msToCheck = checkTime.getTime() - Date.now();
    this.windowChecker = setTimeout(async () => {
      const currentTime = new Date();
      this.requestStatus(currentTime);
    }, msToCheck);
  }
  
  /**
   * Clear the window checker if it is currently set.
   */
  private clearWindowChecker = () => {
    if (this.windowChecker !== null) {
      clearTimeout(this.windowChecker);
      this.windowChecker = null;
    }
  }
}
