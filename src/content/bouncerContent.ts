import browser from "webextension-polyfill";

// This is effectively an IIFE.
doBouncer();

async function doBouncer() {
  // TODO: move all this to its own ADT.

  const currentTime = new Date();
  // whether event listeners are set
  let listening = false; 
  // checker for viewtime-based blocks
  let viewtimeChecker: NodeJS.Timeout | null = null;
  // checker for window-based blocks
  let windowChecker: NodeJS.Timeout | null = null;
  // whether the page is blocked
  let blocked = false;

  
  // first thing's first: see what Bouncer has to say about this page
  await onCheck(currentTime);
  
  if (blocked) {
    return;
  }

  await onVisit(currentTime);
  if (pageVisible()) {
    await onShow(currentTime);
  }

  // carry out instructions received from service worker
  async function enforce(status: any) {
    switch (status.status) {
      case "BLOCKED":
        blocked = true;
        block();
        break;
      case "ALLOWED":
        addListeners();
        if (status.viewtimeCheck !== undefined) {
          resetViewtimeChecker(status.viewtimeCheck);
        }
        if (status.windowCheck !== undefined) {
          resetWindowChecker(status.windowCheck);
        }
        break;
      case "UNTRACKED":
        clearViewtimeChecker();
        clearWindowChecker();
        removeListeners();
        break;
    }
  }

  async function onVisit(time: Date) {
    const status = await sendMessage("VISIT", time);
    enforce (status);
  }

  async function onShow(time: Date) {
    const status = await sendMessage("SHOW", time);
    enforce(status);
  }
  
  async function onHide(time: Date) {
    const status = await sendMessage("HIDE", time);
    enforce(status);
  }
  
  async function onVisiblity(time: Date) {
    if (pageVisible()) {
      await onShow(time);
    } else {
      await onHide(time);
    }
  }

  async function onCheck(time: Date) {
    const status = await sendMessage("CHECK", time);
    enforce(status);
  }


  async function handleShow() { await onShow(new Date()); }
  async function handleHide() { await onHide(new Date()); }
  async function handleVisibilty() { await onVisiblity(new Date()); }

  /**
   * Set listeners for events related to page browsing.
   */
  function addListeners() {
    if (!listening) {
      const options = { capture: true };
      window.addEventListener("pageshow", handleShow, options);
      window.addEventListener("pagehide", handleHide, options);
      window.addEventListener("visibilitychange", handleVisibilty, options);
      listening = true;
    }
  }

  /**
   * Remove listeners.
   */
  function removeListeners() {
    if (listening) {
      const options = { capture: true };
      window.removeEventListener("pageshow", handleShow, options);
      window.removeEventListener("pagehide", handleHide, options);
      window.removeEventListener("visibilitychange", handleVisibilty, options);
      listening = false;
    }
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
      await onCheck(currentTime);
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
      await onCheck(currentTime);
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
    removeListeners();
    if (viewtimeChecker !== null) {
      clearInterval(viewtimeChecker);
      viewtimeChecker = null;
    }
    location.assign(browser.runtime.getURL("dist/pages/blocked/blocked.html"));
    console.log(`${new Date().getTime()} BOUNCER: blocking page...`);
  }
}


/** Whether the current page is visible or not. */
function pageVisible(): boolean { return document.visibilityState === "visible"; }


type MessageType =
    "CHECK"  // no event, just check current state
  | "VISIT"
  | "SHOW"
  | "HIDE"
  ;

/**
 * Send a message/event to the Bouncer service worker.
 * 
 * TODO: abstractify messaging
 * 
 * @param type type of message to send
 * @param time manually specified message time
 * @returns instructions from the Bouncer service worker
 */
async function sendMessage(type: MessageType, time: Date): Promise<any> {
  console.log(`${time.getTime()} cont: sending ${type}`);
  const status = await browser.runtime.sendMessage({ type, time });
  console.log(`${time.getTime()} cont: ${type} received ${status.status}`);
  return status;
}

