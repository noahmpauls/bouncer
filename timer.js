document.body.style.border = "5px solid red";
let path = window.location.host;
console.log(path);

browser.storage.local.get(path)
  .then(time => {
    console.log("retrieved from storage");
    console.log(time);
  });

let hostTime = {};
hostTime[path] = Date.now();
browser.storage.local.set(hostTime)
  .then(() => console.log("time is set."));

window.onbeforeunload(async () => {

});
