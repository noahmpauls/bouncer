const linkContainer = document.getElementById("link-container");

const settingsLink = document.createElement("a");
settingsLink.innerText = "Settings";
settingsLink.href = browser.runtime.getURL("dist/pages/settings/settings.html");
settingsLink.target = "_blank";


settingsLink.addEventListener("click", function() {
  // just calling window.close() opens the link in a new window
  setTimeout(window.close, 1);
});

linkContainer.appendChild(settingsLink);