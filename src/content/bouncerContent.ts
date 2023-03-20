import browser from "webextension-polyfill";

doBouncer();

async function doBouncer() {
  const currentTime = new Date();
  let listening = false;
  let viewtimeChecker: NodeJS.Timeout | null = null;
  let blocked = false;

  await onCheck(currentTime);
  
  // 
  if (blocked) {
    return;
  }

  await onVisit(currentTime);
  if (pageVisible()) {
    await onShow(currentTime);
  }

  async function enforce(status: any) {
    switch (status.status) {
      case "BLOCKED":
        blocked = true;
        block();
        break;
      case "ALLOWED":
        addListeners();
        if (status.viewtimeCheck !== undefined) {
          // TODO: clean this up
          if (viewtimeChecker !== null) {
            clearTimeout(viewtimeChecker);
          }
          const msToCheck = status.viewtimeCheck.getTime() - (new Date()).getTime();
          viewtimeChecker = setTimeout(async () => {
            const currenTime = new Date();
            await onCheck(currenTime);
          }, msToCheck);
        }
        break;
      case "UNTRACKED":
        if (viewtimeChecker !== null) {
          clearTimeout(viewtimeChecker);
          viewtimeChecker = null;
        }
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

  function addListeners() {
    if (!listening) {
      const options = { capture: true };
      window.addEventListener("pageshow", handleShow, options);
      window.addEventListener("pagehide", handleHide, options);
      window.addEventListener("visibilitychange", handleVisibilty, options);
      listening = true;
    }
  }

  function removeListeners() {
    if (listening) {
      const options = { capture: true };
      window.removeEventListener("pageshow", handleShow, options);
      window.removeEventListener("pagehide", handleHide, options);
      window.removeEventListener("visibilitychange", handleVisibilty, options);
      listening = false;
    }
  }
  //
  // TODO: change Bouncer to effectively end on pagehide, restart on pageshow?
  //       can't rely on unload event to clear bfcache
  function block(): void {
    // invalidate the bfcache for the page otherwise script state at block time
    // is preserved, so hitting back button doesn't trigger block
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


function pageVisible(): boolean { return document.visibilityState === "visible"; }

type MessageType =
    "CHECK"
  | "VISIT"
  | "SHOW"
  | "HIDE"
  ;

async function sendMessage(type: MessageType, time: Date): Promise<any> {
  console.log(`${time.getTime()} cont: sending ${type}`);
  const status = await browser.runtime.sendMessage({ type, time });
  console.log(`${time.getTime()} cont: ${type} received ${status.status}`);
  return status;
}

