// Using an IIFE, as content scripts don't appear to support JS modules or
// top-level await.
(async () => {
  const rules = await browser.storage.local.get({ rules: [] })
    .then(data => {
      ruleData = data.rules;
      const rules = new Map(ruleData.map(r => ([r.host, r.milliseconds])));
      return rules;
    });

  // Get the host and record the visit to it
  const host = window.location.host;
  await recordLastSite(host);

  const limit = rules.get(host);
  let checker = undefined;
  let viewStartTime = undefined;

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
    const viewTime = await getStorage(`viewTime:${host}`, 0);
    const isBlocked = viewTime > limit;
    if (isBlocked) {
      const lastVisit = await getLastBlockTime(host);
      const currentTime = Date.now();
      const minAway = 10000; // minimum milliseconds to wait after block
      if (lastVisit < 0 || currentTime - lastVisit >= minAway) {
        await modifyStorage(`viewTime:${host}`, 0, () => 0);
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
      const viewTime = await getStorage(`viewTime:${host}`, 0);
      const additionalTime = Date.now() - viewStartTime;
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
  
  async function block(host, setBlockTime=false) {
    console.log("BOUNCER: blocking site");
    await pause();
    if (setBlockTime) {
      await setLastBlockTime(host);
    }
    blockSite();
  }
  
  async function setLastBlockTime(host) {
    await modifyStorage(`lastVisitTime:${host}`, -1, () => Date.now());
  }

  async function resetLastBlockTime(host) {
    await modifyStorage(`lastVisitTime:${host}`, -1, () => -1);
  }
  
  async function getLastBlockTime(host) {
    return await getStorage(`lastVisitTime:${host}`, -1);
  }

  async function recordLastSite(site) {
    await modifyStorage("lastSite", [], prev => {
      let next = [...prev];
      next.push(site);
      return next;
    })
  }

  function blockSite() {
    window.location = browser.runtime.getURL("pages/blocked/blocked.html");
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

    await modifyStorage(`viewTime:${host}`, 0, prev => {
      return prev + viewTime;
    });
  }

  async function modifyStorage(key, defaultValue = null, update) {
    let getArg = key;
    if (defaultValue !== null) {
      getArg = { [key]: defaultValue };
    }
    await browser.storage.local.get(getArg)
      .then(value => {
        value[key] = update(value[key]);
        return value;
      })
      .then(value => {
        browser.storage.local.set(value);
      });
  }
  
  async function getStorage(key, defaultValue = null) {
    let getArg = key;
    if (defaultValue !== null) {
      getArg = { [key]: defaultValue };
    }
    return await browser.storage.local.get(getArg)
      .then(data => data[key]);
  }

  function doSetInterval(func, delay) {
    func();
    return setInterval(func, delay);
  }
})();