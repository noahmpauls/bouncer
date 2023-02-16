const rulesDiv = document.getElementById("rules");

browser.storage.local.get({ rules: [] })
  .then(data => {
    rulesDiv.children = [];
    rules = data.rules;
    for (const rule of rules) {
      const ruleElement = document.createElement("p");
      ruleElement.innerText = `${rule.host}: ${rule.milliseconds}`;
      rulesDiv.appendChild(ruleElement);
    }
  });

const ruleForm = document.getElementById("add-rule");

ruleForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const dataObject = {};
  for (const field of data) {
    const value = field[0] === "milliseconds" ? parseInt(field[1]) : field[1];
    dataObject[field[0]] = value;
  }
  browser.storage.local.get({ rules: [] })
    .then(data => {
      next = [...data.rules];
      next.push(dataObject);
      browser.storage.local.set({ rules: next });
    })
})