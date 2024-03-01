import browser from "webextension-polyfill";
import { PageMessageType, type PageMessage, type BouncerMessage, FrameStatus } from "./message";

// This is effectively an IIFE.
doBouncer();

async function doBouncer() {
  // TODO: move all this to its own ADT.

  // checker for viewtime-based blocks
  let viewtimeChecker: NodeJS.Timeout | null = null;
  // checker for window-based blocks
  let windowChecker: NodeJS.Timeout | null = null;
  // whether the page is blocked
  let blocked = false;

  async function onMessage(message: BouncerMessage | null, time: Date) {
    console.log(`${time.getTime()} cont: received ${message?.status}`);
    if (message !== null) {
      enforce(message);
    }
  }

  async function handleMessage(message: any) { onMessage(message, new Date()) }

  browser.runtime.onMessage.addListener(handleMessage);

  onCheck(new Date());

  // carry out instructions received from service worker
  async function enforce(message: BouncerMessage) {
    const currentTime = new Date();
    switch (message.status) {
      case FrameStatus.BLOCKED:
        blocked = true;
        block();
        break;
      case FrameStatus.ALLOWED:
        if (message.viewtimeCheck !== undefined) {
          console.log(`viewtime check in ${(message.viewtimeCheck.getTime() - Date.now()) / 1000} seconds`)
          resetViewtimeChecker(message.viewtimeCheck);
        }
        if (message.windowCheck !== undefined) {
          console.log(`window check in ${(message.windowCheck.getTime() - Date.now()) / 1000} seconds`)
          resetWindowChecker(message.windowCheck);
        }
        break;
      case FrameStatus.UNTRACKED:
        clearViewtimeChecker();
        clearWindowChecker();
        browser.runtime.onMessage.removeListener(handleMessage);
        break;
    }
  }

  function onCheck(time: Date) {
    sendMessage({
      type: PageMessageType.CHECK,
      time
    });
  }


  /**
   * Set the viewtime checker to send a check to the service worker at the
   * given time.
   * 
   * @param checkTime time at which checker should fire
   */
  function resetViewtimeChecker(checkTime: Date) {
    clearViewtimeChecker();
    const msToCheck = checkTime.getTime() - Date.now();
    viewtimeChecker = setTimeout(async () => {
      const currentTime = new Date();
      onCheck(currentTime);
    }, msToCheck);
  }
  
  /**
   * Clear the viewtime checker if it is currently set.
   */
  function clearViewtimeChecker() {
    if (viewtimeChecker !== null) {
      clearTimeout(viewtimeChecker);
      viewtimeChecker = null;
    }
  }
  
  /**
   * Set the window checker to send a check to the service worker at the given
   * time.
   *
   * @param checkTime time at which checker should fire
   */
  function resetWindowChecker(checkTime: Date) {
    clearWindowChecker();
    const msToCheck = checkTime.getTime() - Date.now();
    windowChecker = setTimeout(async () => {
      const currentTime = new Date();
      onCheck(currentTime);
    }, msToCheck);
  }
  
  /**
   * Clear the window checker if it is currently set.
   */
  function clearWindowChecker() {
    if (windowChecker !== null) {
      clearTimeout(windowChecker);
      windowChecker = null;
    }
  }

  /**
   * Enforce a block on the current page.
   */
  function block(): void {
    // invalidate the bfcache for the page otherwise script state at block time
    // is preserved, so hitting back button doesn't trigger block
    // 
    // TODO: change Bouncer to not rely on bfcache invalidation via unload, as
    //  this is unreliable. Maybe restart content script on each pageshow?
    window.addEventListener("unload", () => { });
    if (viewtimeChecker !== null) {
      clearInterval(viewtimeChecker);
      viewtimeChecker = null;
    }
    location.assign(browser.runtime.getURL("dist/ui/blocked/index.html"));
    console.log(`${new Date().getTime()} BOUNCER: blocking page...`);
  }
}


/**
 * Send a message/event to the Bouncer service worker.
 * 
 * TODO: abstractify messaging
 * 
 * @param message message to send
 */
function sendMessage(message: PageMessage) {
  console.log(`${message.time.getTime()} cont: sending ${message.type}`);
  browser.runtime.sendMessage(message);
}

