import browser from "webextension-polyfill";
import { IStorage } from "./storage";
import { BrowserStorage } from "./browserStorage";
import { doSetInterval } from "./utils";

type Rule = {
  host: string
  milliseconds: number
}

async function initializeBouncer() {
  const storage: IStorage<any> = new BrowserStorage();
  const ruleData: Rule[] = await storage.get("rules", []);
  const rules = new Map(ruleData.map((r: Rule) => ([r.host, r.milliseconds])));

  // Get the host and record the visit to it
  const host = window.location.host;
  await recordLastSite(host);

  const limit = rules.get(host);
  let checker: NodeJS.Timer | undefined = undefined;
  let viewStartTime: number | undefined = undefined;

  // Only activate bouncer for this page if a limit applies
  if (limit !== undefined && limit !== null) {
    if (document.visibilityState === "visible") {
      await activate();
    }

    window.addEventListener("visibilitychange", async (event) => {
      if (document.visibilityState === "visible") {
        await activate();
      } else if (document.visibilityState === "hidden") {
        await pause();
      }
    }, { capture: true });

    window.addEventListener("pageshow", async (event) => {
      if (document.visibilityState === "visible") {
        await activate();
      }
    }, { capture: true });

    window.addEventListener("pagehide", async (event) => {
      await pause();
    }, { capture: true });
  }

  async function activate() {
    if (limit === undefined || limit === null) {
      return;
    }
    
    // Check whether a block is currently in place, and whether that block
    // has expired.
    const viewTime = await storage.get(`viewTime:${host}`, 0);
    const isBlocked = viewTime > limit;
    if (isBlocked) {
      const lastVisit = await getLastBlockTime(host);
      const currentTime = Date.now();
      const minAway = 10000; // minimum milliseconds to wait after block
      if (lastVisit < 0 || currentTime - lastVisit >= minAway) {
        await storage.set(`viewTime:${host}`, 0);
        await resetLastBlockTime(host);
      } else {
        await block(host);
        return;
      }
    }
    // Ensure a checker isn't already running.
    // TODO: determine why this happens; probably due to shared context between
    // content scripts.
    if (checker !== undefined) {
      return;
    }
    await setViewStartTime();
    checker = doSetInterval(async () => {
      const viewTime = await storage.get(`viewTime:${host}`, 0);
      const additionalTime = Date.now() - viewStartTime!;
      if (viewTime + additionalTime > limit) {
        await block(host, true);
      }
    }, 1000);
  }

  async function pause() {
    if (limit === undefined || limit === null) {
      return;
    }
    await setSiteViewTime();
    clearInterval(checker);
    checker = undefined;
  }
  
  async function block(host: string, setBlockTime: boolean=false) {
    console.log("BOUNCER: blocking site");
    await pause();
    if (setBlockTime) {
      await setLastBlockTime(host);
    }
    blockSite();
  }
  
  async function setLastBlockTime(host: string) {
    await storage.set(`lastVisitTime:${host}`, Date.now());
  }

  async function resetLastBlockTime(host: string) {
    await storage.set(`lastVisitTime:${host}`, -1);
  }
  
  async function getLastBlockTime(host: string): Promise<number> {
    return await storage.get(`lastVisitTime:${host}`, -1);
  }

  async function recordLastSite(site: string) {
    await storage.update("lastSite", prev => {
      let next = [...prev];
      next.push(site);
      return next;
    }, []);
  }

  function blockSite() {
    location.assign(browser.runtime.getURL("pages/blocked/blocked.html"));
  }

  async function setViewStartTime() {
    viewStartTime = Date.now();
  }

  async function setSiteViewTime() {
    if (viewStartTime === undefined || viewStartTime === null) {
      console.error(`cannot record site view time when start time is ${viewStartTime}`)
      return
    }

    const viewTime = Date.now() - viewStartTime;

    await storage.update(`viewTime:${host}`, prev => {
      return prev + viewTime;
    }, 0);
  }
}

initializeBouncer();