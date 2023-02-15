// document.body.style.border = "5px solid red";

let host = window.location.host;
console.log(host);

browser.storage.local.get(host)
  .then(time => {
    console.log("retrieved from storage");
    console.log(time);
  });

let hostTime = {};
hostTime[host] = Date.now();
browser.storage.local.set(hostTime)
  .then(() => console.log("time is set."));

window.addEventListener("beforeunload", () => {
  console.log("before unload: setting last site")
  recordLastSite(host);
})

browser.storage.local.get("lastSite")
  .then(value => {
    console.log("got last site.")
    console.log(value)
  });

function recordLastSite(site) {
  const addSite = prev => {
    if (prev === undefined) {
      return [site];
    } else {
      let next = [...prev];
      next.push(site);
      return next;
    }
  }
  
  modifyStorage("lastSite", addSite);
}

function modifyStorage(key, update) {
  browser.storage.local.get(key)
    .then(value => {
      value[key] = update(value[key]);
      return value;
    })
    .then(value => {
      browser.storage.local.set(value);
    });
}
