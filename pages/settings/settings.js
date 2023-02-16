refreshRuleDisplay();

const ruleForm = document.getElementById("add-rule");
const hostInput = document.getElementById("host");
const millisecondsInput = document.getElementById("milliseconds");

ruleForm.addEventListener("submit", event => {
  event.preventDefault();
  const dataObject = {
    host: host.value,
    milliseconds: parseInt(milliseconds.value)
  };
  hostInput.value = "";
  millisecondsInput.value = "";
  browser.storage.local.get({ rules: [] })
    .then(data => {
      next = [...data.rules].filter(r => r.host !== dataObject.host);
      next.push(dataObject);
      browser.storage.local.set({ rules: next })
        .then(() => refreshRuleDisplay());
    });
});

function refreshRuleDisplay() {
  const rulesDiv = document.getElementById("rules");

  browser.storage.local.get({ rules: [] })
    .then(data => {
      rulesDiv.replaceChildren();
      rules = data.rules;
      for (const rule of rules) {
        const ruleElement = document.createElement("p");
        ruleElement.innerText = `${rule.host}: ${rule.milliseconds}`;
        rulesDiv.appendChild(ruleElement);
      }
    });
}
