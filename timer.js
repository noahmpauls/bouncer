// Get the host and record the visit to it
let host = window.location.host;
console.log(host);
recordLastSite(host);

// Start timing the current page view
let viewStartTime = undefined;
if (document.visibilityState === "visible") {
  setViewStartTime();
}

window.addEventListener("visibilitychange", event => {
  if (document.visibilityState === "visible") {
    setViewStartTime();
  } else if (document.visibilityState === "hidden") {
    setSiteViewTime();
  }
});

window.addEventListener("pageshow", event => {
  if (document.visibilityState === "visible") {
    setViewStartTime();
  }
});

window.addEventListener("pagehide", event => {
  setSiteViewTime();
});

function recordLastSite(site) {
  modifyStorage("lastSite", [], prev => {
    let next = [...prev];
    next.push(site);
    return next;
  });
}

function setViewStartTime() {
  console.log("start view time");
  viewStartTime = Date.now();
}

function setSiteViewTime() {
  console.log("end view time");
  if (viewStartTime === undefined || viewStartTime === null) {
    console.error(`cannot record site view time when start time is ${viewStarTime}`)
    return
  }

  const viewTime = Date.now() - viewStartTime;
  
  modifyStorage(`viewTime:${host}`, 0, prev => {
    console.log(prev);
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
