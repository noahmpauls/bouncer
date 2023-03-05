import { BrowserStorage } from "./browserStorage";
import { IBouncerData, StoredBouncerData } from "./data";
import { IPage, PageAccess, PageEvent } from "./page";
import { IRule } from "./rule";

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
    let nextViewtimeCheck = minRemainingViewtime(rulesAndPages);
    if (nextViewtimeCheck < Infinity) {
      viewtimeChecker = setTimeout(() => {
        for (let {rule, page} of rulesAndPages) {
          rule.applyTo(currentTime, page);
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
  function onHide(currentTime: Date) {
    clearViewtimeChecker();
    for (let {metadata, page} of rulesAndPages) {
      page.recordEvent(currentTime, PageEvent.HIDE);
      data.setPolicyPage(metadata, page);
    }
  }

  // no applicable rules means no Bouncer required
  if (rulesAndPages.length === 0) {
    return;
  }

  // check for an existing block and enforce it
  for (let {rule, page} of rulesAndPages) {
    rule.applyTo(currentTime, page);
  }
  for (let {page} of rulesAndPages) {
    if (page.checkAccess(currentTime) === PageAccess.BLOCKED) {
      block();
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
    onHide(new Date());
  }, { capture: true });

  window.addEventListener("visibilitychange", async () => {
    const currentTime = new Date();
    if (pageVisible()) {
      onShow(currentTime);
    } else {
      onHide(currentTime);
    }
  }, { capture: true });
}

initializeBouncer();

function pageVisible(): boolean { return document.visibilityState === "visible"; }

function minRemainingViewtime(rulesAndPages: { rule: IRule, page: IPage }[]): number {
  const remainings = rulesAndPages.map(({rule, page}): number => rule.remainingViewtime(page));
  return Math.min(...remainings);
}

function block(): void {
  throw new Error("not implemented!");
}