import browser from "webextension-polyfill";
import { BrowserStorage } from "../browserStorage";
import { IBouncerData, StoredBouncerData } from "../data";
import { IPage, PageAccess, PageEvent } from "../page";
import { IRule } from "../rule";

// TODO: move a bunch of this functionality to a class that handles bulk
//       updates to rules and pages.


async function initializeBouncer() {
  const currentTime = new Date();
  const url = window.location;
  const data: IBouncerData = new StoredBouncerData(new BrowserStorage());
  const rulesAndPages = (await data.getApplicablePolicies(new URL(url.href)))
    .map(value => ({ metadata: value.metadata, rule: value.policy.rule, page: value.page }));
  let viewtimeChecker: NodeJS.Timeout | null = null;

  /**
   * Set the viewtime checker to check rules for a block at the next expected
   * block time.
   */
  function setViewtimeChecker(): void {
    const currentTime = new Date();
    let nextViewtimeCheck = minRemainingViewtime(currentTime, rulesAndPages);
    if (nextViewtimeCheck < Infinity) {
      viewtimeChecker = setTimeout(async () => {
        const currentTime = new Date();
        for (let {metadata, rule, page} of rulesAndPages) {
          rule.applyTo(currentTime, page);
          await data.setPolicyPage(metadata, page);
        }
        for (let {page} of rulesAndPages) {
          if (page.checkAccess(currentTime) === PageAccess.BLOCKED) {
            block();
          }
        }
        setViewtimeChecker();
      }, nextViewtimeCheck);
    }
  }
  
  /** Clear the viewtime checker. */
  function clearViewtimeChecker(): void {
    if (viewtimeChecker !== null) {
      clearTimeout(viewtimeChecker);
    }
  }

  /**
   * When the page becomes visible, record the event and set the viewtime
   * checker.
   */
  function onShow(currentTime: Date) {
    if (pageVisible()) {
      for (let {page} of rulesAndPages) {
        page.recordEvent(currentTime, PageEvent.SHOW);
      }
    }
    setViewtimeChecker();
  }

  /**
   * When the page becomes invisible, clear the viewtime checker, record the
   * event, and persist the page to storage.
   */
  async function onHide(currentTime: Date) {
    clearViewtimeChecker();
    for (let {metadata, page} of rulesAndPages) {
      page.recordEvent(currentTime, PageEvent.HIDE);
      await data.setPolicyPage(metadata, page);
    }
  }

  // no applicable rules means no Bouncer required
  if (rulesAndPages.length === 0) {
    return;
  }

  // check for an existing block and enforce it
  for (let {metadata, rule, page} of rulesAndPages) {
    rule.applyTo(currentTime, page);
    await data.setPolicyPage(metadata, page);
  }
  for (let {page} of rulesAndPages) {
    if (page.checkAccess(currentTime) === PageAccess.BLOCKED) {
      block()
    }
  }
  
  // on page visit, add initial events and start viewtime checker
  for (let {page} of rulesAndPages) {
    page.recordEvent(currentTime, PageEvent.VISIT);
  }
  onShow(currentTime);

  window.addEventListener("pageshow", async () => {
    onShow(new Date());
  }, { capture: true });
  
  window.addEventListener("pagehide", async () => {
    await onHide(new Date());
  }, { capture: true });

  window.addEventListener("visibilitychange", async () => {
    const currentTime = new Date();
    if (pageVisible()) {
      onShow(currentTime);
    } else {
      await onHide(currentTime);
    }
  }, { capture: true });
}

initializeBouncer();

function pageVisible(): boolean { return document.visibilityState === "visible"; }

function minRemainingViewtime(time: Date, rulesAndPages: { rule: IRule, page: IPage }[]): number {
  const remainings = rulesAndPages.map(({rule, page}): number => {
    const viewtime = rule.remainingViewtime(time, page);
    return viewtime;
  });
  return Math.min(...remainings);
}

// TODO: change Bouncer to effectively end on pagehide, restart on pageshow?
//       can't rely on unload event to clear bfcache
function block(): void {
  // invalidate the bfcache for the page otherwise script state at block time
  // is preserved, so hitting back button doesn't trigger block
  window.addEventListener("unload", () => { });
  location.assign(browser.runtime.getURL("dist/pages/blocked/blocked.html"));
  throw new Error(`${new Date().toTimeString()} BOUNCER: blocking page...`);
}