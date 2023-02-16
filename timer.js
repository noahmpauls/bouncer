// Time limits. Maps host to allowed milliseconds of browsing time.
const RULES = new Map([
  ["www.noahpauls.com", 5000],
  ["www.joshwcomeau.com", 10234.23090978627890],
]);

// Get the host and record the visit to it
let host = window.location.host;
recordLastSite(host);

const limit = RULES.get(host);
let checker = undefined;

// Start timing the current page view
let viewStartTime = undefined;
if (document.visibilityState === "visible") {
  activate();
}

window.addEventListener("visibilitychange", event => {
  if (document.visibilityState === "visible") {
    activate();
  } else if (document.visibilityState === "hidden") {
    pause();
  }
});

window.addEventListener("pageshow", event => {
  if (document.visibilityState === "visible") {
    activate();
  }
});

window.addEventListener("pagehide", event => {
  pause();
});

function recordLastSite(site) {
  modifyStorage("lastSite", [], prev => {
    let next = [...prev];
    next.push(site);
    return next;
  });
}

function activate() {
  if (!limit) {
    return;
  }
  // Ensure a checker isn't already running.
  // TODO: determine why this happens; probably due to shared context between
  // content scripts.
  if (checker !== undefined) {
    return;
  }
  setViewStartTime();
  checker = doSetInterval(() => {
    browser.storage.local.get({ [`viewTime:${host}`]: 0 })
      .then(viewTimeResult => {
        const viewTime = viewTimeResult[`viewTime:${host}`];
        const additionalTime = Date.now() - viewStartTime;
        if (viewTime + additionalTime >= limit) {
          pause();
          console.log(`LIMIT REACHED FOR THIS SITE`);
          blockSite();
        }
      });
  }, 1000);
}

function pause() {
  if (!limit) {
    return;
  }
  setSiteViewTime();
  clearInterval(checker);
  checker = undefined;
}

function blockSite() {
  window.location = browser.runtime.getURL("blocked.html");
}

function setViewStartTime() {
  viewStartTime = Date.now();
}

function setSiteViewTime() {
  if (viewStartTime === undefined || viewStartTime === null) {
    console.error(`cannot record site view time when start time is ${viewStartTime}`)
    return
  }

  const viewTime = Date.now() - viewStartTime;
  
  modifyStorage(`viewTime:${host}`, 0, prev => {
    return prev + viewTime;
  });
}

function modifyStorage(key, defaultValue = null, update) {
  let getArg = key;
  if (defaultValue !== null) {
    getArg = { [key]: defaultValue };
  }
  browser.storage.local.get(getArg)
    .then(value => {
      value[key] = update(value[key]);
      return value;
    })
    .then(value => {
      browser.storage.local.set(value);
    });
}

function doSetInterval(func, delay) {
  func();
  return setInterval(func, delay);
}
